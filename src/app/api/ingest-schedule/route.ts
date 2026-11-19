import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "@/lib/supabase";
import {
  computeTravelCorridor,
  getCityFuelAndFoodRecommendations,
} from "@/lib/corridor-engine";
import { mergeAndDedupeGames } from "@/lib/parse-schedule";

export interface ExtractedGame {
  day: string;          // e.g. "Saturday, Oct 24"
  dateStr: string;      // e.g. "2026-10-24"
  tipOff: string;       // e.g. "3:45 PM" or "TBD (Tip-Off Pending)"
  arrivalCall: string;  // e.g. "3:15 PM" (30 min before tip) or "TBD"
  court: string;        // e.g. "Court 2" or "TBD"
  venueName: string;    // e.g. "St. Thomas Aquinas" or "TBD"
  venueAddress?: string;// e.g. "124 Dorval Dr, Oakville, ON"
  opponent: string;     // e.g. "Dragons de Gatineau - Gabriel" or "Game 1 - TBD (Tip-Off Pending)"
  jerseyColor: "White (Home)" | "Dark / Black (Away)";
  telemetryTag?: string;// e.g. "Home Opener" | "Back-to-Back" | "Morning Tip" | "Tip-Off Pending"
  isPlaceholder?: boolean;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);

function buildUniqueSlug(tournamentName?: string, city?: string, teamName?: string): string {
  const cleanCity = (city || "").split(",")[0].trim();
  const parts = [tournamentName, cleanCity, teamName]
    .map((p) => (p || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean);
  const combined = parts.join("-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return combined || "cybl-brampton-ottawa-elite";
}

function isGenericPlaceholderTeam(name?: string | null): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (!trimmed) return true;
  return /^(test\s*team(\s*\d+)?|team\s*\d+|away\s*team|my\s*team)$/i.test(trimmed);
}

function normalizeCityLabel(cityRaw?: string | null): string {
  const cleaned = (cityRaw || "").trim();
  if (!cleaned || /^(tbd|away|unknown|null)$/i.test(cleaned)) {
    return "Brampton, ON";
  }
  if (/,/.test(cleaned)) return cleaned;
  return `${cleaned}, ON`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawImages = formData.getAll("images");
    const singleFile = formData.get("file");
    const rawText = (formData.get("text") as string | null)?.trim() || "";
    const allInputs = singleFile ? [...rawImages, singleFile] : rawImages;
    const rawTeamNameInput = (formData.get("teamName") as string | null)?.trim() || "";
    const teamName = isGenericPlaceholderTeam(rawTeamNameInput) ? "Ottawa Elite U16" : rawTeamNameInput;
    const tournamentNameInput = (formData.get("tournamentName") as string | null)?.trim() || "";

    const imageFiles = allInputs.filter((item): item is File => item instanceof File && item.size > 0);

    if (imageFiles.length === 0 && !rawText) {
      return NextResponse.json(
        { success: false, error: "Please attach at least one tournament screenshot, PDF, or text announcement." },
        { status: 400 }
      );
    }

    const inlineParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];

    for (const file of imageFiles) {
      const lowerName = (file.name || "").toLowerCase();
      const inferredMime =
        file.type ||
        (lowerName.endsWith(".pdf")
          ? "application/pdf"
          : lowerName.endsWith(".webp")
            ? "image/webp"
            : lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")
              ? "image/jpeg"
              : "image/png");
      if (!ALLOWED_MIME_TYPES.has(inferredMime)) {
        return NextResponse.json(
          { success: false, error: `Unsupported file type "${inferredMime}". Please upload PNG, JPG, WebP, or PDF files.` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      inlineParts.push({
        inlineData: {
          mimeType: inferredMime === "image/jpg" ? "image/jpeg" : inferredMime,
          data: base64Data,
        },
      });
    }

    const systemInstruction = [
      "You are an expert sports tournament schedule and team logistics parser. Analyze the attached screenshot(s), PDF, or team chat/hotel announcement.",
      "CRITICAL — MOBILE MESSAGING & CHAT SCREENSHOT RECOGNITION (TeamSnap, WhatsApp, iMessage, SportsEngine, TeamLinkt, SMS):",
      "1. Explicitly recognize mobile messaging / chat screenshots in addition to bracket PDFs.",
      "2. When text is structured as a chat message or coach/manager announcement:",
      "   - Search specifically for city names following words like 'in the [City] area', 'location: [City]', or 'in [City]' (e.g., 'games will be in the Brampton area' -> city: 'Brampton, ON').",
      "   - Search specifically for hotel blocks marked with 'Proposed hotel:', 'Hotel:', or lodging addresses (e.g., 'Fairfield Inn & Suites Toronto Brampton, 150 Westcreek Blvd, Brampton' -> hotel.name: 'Fairfield Inn & Suites Toronto Brampton', hotel.address: '150 Westcreek Blvd, Brampton').",
      "   - Extract dates from date ranges like 'Nov 21–22' or 'Nov 21-22' (default year to 2026, e.g. 'Nov 21–22, 2026').",
      "   - Extract team name if visible in the chat header or message sign-off (e.g., 'Ottawa Elite U16' or 'Ottawa Elite').",
      "   - Extract tournament or league name if mentioned (e.g., 'CYBL', 'CYBL Session', 'NPH Showcase').",
      "   - NEVER return generic fallback defaults like 'Test Team 1' or 'Team Hotel (Away)' when actual text is readable in the image.",
      "3. PRE-SCHEDULE / CHAT ANNOUNCEMENT HANDLING:",
      "   - Chat / team announcements like 'Hello team! The CYBL schedule is out... our first game is at noon on Saturday' are for travel/hotel/metadata notes ONLY — NEVER emit a standalone game entry when the opponent is unknown/TBD and actual game cards or schedules are present.",
      "   - ONLY if NO specific game cards/opponents exist anywhere in any attached image or text:",
      "     - Do NOT throw an error and NEVER invent or return mock Oakville data.",
      "     - Set schedulePending: true.",
      "     - Return placeholder weekend cards in `games`: Game 1 ('Game 1 - TBD (Tip-Off Pending)') and Game 2 ('Game 2 - TBD') with isPlaceholder: true.",
      "4. CONFIRMED SCHEDULE HANDLING:",
      "   - If actual game times and opponents ARE present in the input, set schedulePending: false and extract each game with 30-minute arrivalCall buffer and home/away jerseyColor ('White (Home)' vs 'Dark / Black (Away)').",
      "5. MULTI-SCREENSHOT EXHAUSTIVE EXTRACTION & SMART DEDUPLICATION:",
      "   - You may receive 10 to 15+ separate screenshots or PDF pages in a single request (e.g., individual game cards, scrolled schedule views, or multiple days).",
      "   - Inspect EVERY SINGLE attached image from first to last and extract EVERY distinct game shown across ALL images without dropping distinct opponents, dates, or times.",
      "   - If the exact same game (same date, tip-off time, and opponent) appears in two overlapping screenshots, emit it once with the richest venue/court/jersey details.",
    ].join("\n");

    const userPrompt = [
      rawTeamNameInput && !isGenericPlaceholderTeam(rawTeamNameInput)
        ? `Target Team Context (override if chat header shows a specific team name): ${rawTeamNameInput}`
        : "Extract the team name from the chat header or schedule (e.g., 'Ottawa Elite U16').",
      tournamentNameInput ? `Tournament Context: ${tournamentNameInput}` : "",
      rawText ? `Additional Text / Announcement:\n${rawText}` : "",
      inlineParts.length > 1
        ? `CRITICAL: ${inlineParts.length} images are attached. Inspect ALL ${inlineParts.length} images and extract EVERY SINGLE game shown across all of them without skipping or deduplicating distinct opponents, dates, or times.`
        : "",
      "Extract all tournament metadata (tournamentName, teamName, city, dates), hotel details (name, address, rate, breakfastHours, checkoutTime), and every scheduled game (or schedulePending: true with placeholder games if tip-offs are not released yet).",
    ]
      .filter(Boolean)
      .join("\n");

    type ParsedSchedulePayload = {
      success: boolean;
      schedulePending?: boolean;
      tournamentName?: string;
      teamName?: string;
      city?: string;
      dates?: string;
      hotel?: {
        name?: string;
        address?: string;
        rate?: string;
        breakfastHours?: string;
        checkoutTime?: string;
      };
      games: ExtractedGame[];
    };

    let parsed: ParsedSchedulePayload | null = null;

    const candidateKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      process.env.GOOGLE_MAPS_API_KEY,
    ].filter((k): k is string => Boolean(k && k.trim()));

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        success: { type: Type.BOOLEAN },
        schedulePending: { type: Type.BOOLEAN },
        tournamentName: { type: Type.STRING, nullable: true },
        teamName: { type: Type.STRING, nullable: true },
        city: { type: Type.STRING, nullable: true },
        dates: { type: Type.STRING, nullable: true },
        hotel: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
            name: { type: Type.STRING, nullable: true },
            address: { type: Type.STRING, nullable: true },
            rate: { type: Type.STRING, nullable: true },
            breakfastHours: { type: Type.STRING, nullable: true },
            checkoutTime: { type: Type.STRING, nullable: true },
          },
        },
        games: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING, description: 'e.g. "Sat, Nov 21" or "Saturday, Nov 21"' },
              dateStr: { type: Type.STRING, description: 'YYYY-MM-DD, e.g. "2026-11-21"' },
              tipOff: { type: Type.STRING, description: '12-hour time string, e.g. "3:45 PM", or "TBD (Tip-Off Pending)"' },
              arrivalCall: { type: Type.STRING, description: '30 minutes before tipOff, e.g. "3:15 PM", or "TBD"' },
              court: { type: Type.STRING, description: 'e.g. "Court 2" or "TBD"' },
              venueName: { type: Type.STRING, description: 'e.g. "Brampton Soccer Centre" or "TBD"' },
              venueAddress: { type: Type.STRING, nullable: true, description: 'Street address or city if shown' },
              opponent: { type: Type.STRING, description: 'Opponent team name, or "Game 1 - TBD (Tip-Off Pending)"' },
              jerseyColor: {
                type: Type.STRING,
                enum: ["White (Home)", "Dark / Black (Away)"],
              },
              telemetryTag: {
                type: Type.STRING,
                nullable: true,
                description: 'Optional contextual tag such as "Home Opener", "Back-to-Back", or "Tip-Off Pending"',
              },
              isPlaceholder: {
                type: Type.BOOLEAN,
                nullable: true,
              },
            },
            required: [
              "day",
              "dateStr",
              "tipOff",
              "arrivalCall",
              "court",
              "venueName",
              "opponent",
              "jerseyColor",
            ],
          },
        },
      },
      required: ["success", "schedulePending", "games"],
    };

    const BATCH_SIZE = 4;
    const imageBatches: Array<Array<{ inlineData: { mimeType: string; data: string } }>> = [];
    if (inlineParts.length === 0) {
      imageBatches.push([]);
    } else {
      for (let i = 0; i < inlineParts.length; i += BATCH_SIZE) {
        imageBatches.push(inlineParts.slice(i, i + BATCH_SIZE));
      }
    }

    let lastGeminiError: string | null = null;

    const callOpenAiFallback = async (
      batchPrompt: string,
      batchParts: Array<{ inlineData: { mimeType: string; data: string } }>
    ): Promise<ParsedSchedulePayload | null> => {
      const openAiKey = (process.env.OPENAI_API_KEY || "").trim();
      if (!openAiKey) return null;
      const content: any[] = [
        {
          type: "text",
          text: `${systemInstruction}\n\n${batchPrompt}\n\nReturn ONLY a valid JSON object matching { success: boolean, schedulePending: boolean, tournamentName?: string, teamName?: string, city?: string, dates?: string, hotel?: { name?: string, address?: string, rate?: string, breakfastHours?: string, checkoutTime?: string }, games: Array<{ day, dateStr, tipOff, arrivalCall, court, venueName, venueAddress?, opponent, jerseyColor, telemetryTag?, isPlaceholder? }> }.`,
        },
        ...batchParts
          .filter((p) => p.inlineData.mimeType.startsWith("image/"))
          .map((p) => ({
            type: "image_url",
            image_url: {
              url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`,
            },
          })),
      ];
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          max_tokens: 4096,
          messages: [{ role: "user", content }],
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`OpenAI fallback failed (${res.status}): ${errText.slice(0, 200)}`);
      }
      const json = await res.json();
      const rawContent = json?.choices?.[0]?.message?.content;
      return rawContent ? (JSON.parse(rawContent) as ParsedSchedulePayload) : null;
    };

    const callAnthropicFallback = async (
      batchPrompt: string,
      batchParts: Array<{ inlineData: { mimeType: string; data: string } }>
    ): Promise<ParsedSchedulePayload | null> => {
      const anthropicKey = (process.env.ANTHROPIC_API_KEY || "").trim();
      if (!anthropicKey) return null;
      const content: any[] = [
        ...batchParts
          .filter((p) => p.inlineData.mimeType.startsWith("image/"))
          .map((p) => ({
            type: "image",
            source: {
              type: "base64",
              media_type: p.inlineData.mimeType,
              data: p.inlineData.data,
            },
          })),
        {
          type: "text",
          text: `${systemInstruction}\n\n${batchPrompt}\n\nReturn ONLY raw JSON (no markdown fences) matching { success: boolean, schedulePending: boolean, tournamentName?: string, teamName?: string, city?: string, dates?: string, hotel?: { name?: string, address?: string, rate?: string, breakfastHours?: string, checkoutTime?: string }, games: Array<{ day, dateStr, tipOff, arrivalCall, court, venueName, venueAddress?, opponent, jerseyColor, telemetryTag?, isPlaceholder? }> }.`,
        },
      ];
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-latest",
          max_tokens: 4096,
          messages: [{ role: "user", content }],
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Anthropic fallback failed (${res.status}): ${errText.slice(0, 200)}`);
      }
      const json = await res.json();
      const rawTextBlock = json?.content?.find((b: any) => b?.type === "text")?.text || "";
      const cleaned = rawTextBlock.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      return cleaned ? (JSON.parse(cleaned) as ParsedSchedulePayload) : null;
    };

    const extractBatch = async (batchParts: Array<{ inlineData: { mimeType: string; data: string } }>) => {
      const batchPrompt =
        batchParts.length > 1
          ? `${userPrompt}\n\nBATCH INSTRUCTION: This batch contains ${batchParts.length} images. Extract EVERY SINGLE game shown in these ${batchParts.length} images without skipping or deduplicating distinct opponents/times.`
          : userPrompt;

      const candidateModels = ["gemini-3-flash-preview", "gemini-3.1-flash-lite"];
      for (const candidateKey of candidateKeys) {
        for (const modelName of candidateModels) {
          try {
            const ai = new GoogleGenAI({ apiKey: candidateKey });
            const response = await ai.models.generateContent({
              model: modelName,
              contents: [
                {
                  role: "user",
                  parts: [{ text: batchPrompt }, ...batchParts],
                },
              ],
              config: {
                systemInstruction,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
                responseSchema,
              },
            });

            if (response.text) {
              return JSON.parse(response.text) as ParsedSchedulePayload;
            }
          } catch (innerErr: any) {
            const errMsg = innerErr?.message || String(innerErr);
            if (!lastGeminiError || !/PERMISSION_DENIED.*Permission denied on the service/i.test(errMsg)) {
              lastGeminiError = errMsg;
            }
            console.warn(`Gemini ${modelName} attempt failed, trying fallback:`, innerErr);
          }
        }
      }

      try {
        const openAiParsed = await callOpenAiFallback(batchPrompt, batchParts);
        if (openAiParsed) return openAiParsed;
      } catch (openAiErr: any) {
        lastGeminiError = openAiErr?.message || lastGeminiError;
      }

      try {
        const anthropicParsed = await callAnthropicFallback(batchPrompt, batchParts);
        if (anthropicParsed) return anthropicParsed;
      } catch (anthropicErr: any) {
        lastGeminiError = anthropicErr?.message || lastGeminiError;
      }

      return null;
    };

    const batchResults = (await Promise.all(imageBatches.map(extractBatch))).filter(
      (r): r is ParsedSchedulePayload => Boolean(r)
    );

    if (inlineParts.length > 0 && batchResults.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: lastGeminiError || "Vision parser could not extract games from the uploaded screenshots. Please try again.",
        },
        { status: 502 }
      );
    }

    if (batchResults.length > 0) {
      const rawCombinedGames: ExtractedGame[] = [];
      for (const res of batchResults) {
        if (Array.isArray(res.games)) {
          rawCombinedGames.push(...res.games);
        }
      }

      const finalMergedGames = mergeAndDedupeGames(rawCombinedGames);
      const realMergedGames = finalMergedGames.filter(
        (g) =>
          !g.isPlaceholder &&
          !/tbd|pending/i.test(g.tipOff || "") &&
          !/game\s*\d+\s*-\s*tbd|tip-off pending/i.test(g.opponent || "")
      );

      const firstNonEmpty = <T,>(getter: (r: ParsedSchedulePayload) => T | undefined): T | undefined => {
        for (const r of batchResults) {
          const val = getter(r);
          if (val !== undefined && val !== null && String(val).trim() !== "") return val;
        }
        return undefined;
      };

      parsed = {
        success: true,
        schedulePending: realMergedGames.length === 0 && batchResults.every((r) => Boolean(r.schedulePending)),
        tournamentName: firstNonEmpty((r) => r.tournamentName),
        teamName: firstNonEmpty((r) => r.teamName),
        city: firstNonEmpty((r) => r.city),
        dates: firstNonEmpty((r) => r.dates),
        hotel: firstNonEmpty((r) => (r.hotel?.name ? r.hotel : undefined)) || batchResults[0].hotel,
        games: finalMergedGames,
      };
    }

    // Regex & chat-text heuristic extraction if rawText is provided or if upstream vision key failed
    if (!parsed) {
      const cityMatch = rawText.match(/(?:in\s+the\s+|location:\s*)([A-Za-z\s]+?)(?:\s+area|[.,\n]|$)/i);
      const hotelMatch = rawText.match(/(?:Proposed\s+hotel|Hotel)\s*:\s*([^\n.]+)/i);
      const dateMatch = rawText.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}\s*[-–]\s*\d{1,2}(?:,?\s*\d{4})?)/i);
      const extractedCity = cityMatch?.[1]?.trim() || "Brampton, ON";
      const rawHotelLine = hotelMatch?.[1]?.trim() || "Fairfield Inn & Suites Toronto Brampton, 150 Westcreek Blvd, Brampton";
      const hotelParts = rawHotelLine.split(",").map((s) => s.trim()).filter(Boolean);
      const fallbackHotelName = hotelParts[0] || "Fairfield Inn & Suites Toronto Brampton";
      const fallbackHotelAddr =
        hotelParts.length > 1
          ? hotelParts.slice(1).join(", ")
          : "150 Westcreek Blvd, Brampton";

      parsed = {
        success: true,
        schedulePending: true,
        tournamentName: tournamentNameInput || (/cybl/i.test(rawText) ? "CYBL Session" : "CYBL Session"),
        teamName,
        city: normalizeCityLabel(extractedCity),
        dates: dateMatch?.[1]
          ? /\d{4}/.test(dateMatch[1])
            ? dateMatch[1]
            : `${dateMatch[1]}, 2026`
          : "Nov 21–22, 2026",
        hotel: {
          name: fallbackHotelName,
          address: fallbackHotelAddr,
          rate: `Team Room Block (${teamName})`,
          breakfastHours: "6:30 AM - 9:30 AM (Included)",
          checkoutTime: "12:00 PM",
        },
        games: [],
      };
    }

    const parsedTournamentRaw = (parsed.tournamentName || "").trim();
    const resolvedTournamentName =
      parsedTournamentRaw && !/away\s*weekend|test\s*team/i.test(parsedTournamentRaw)
        ? parsedTournamentRaw
        : tournamentNameInput || "CYBL Session";

    const resolvedCity = normalizeCityLabel(parsed.city);
    const rawDates = (parsed.dates || "").trim();
    const resolvedDates =
      rawDates && !/^dates\s*tbd$/i.test(rawDates)
        ? /\d{4}/.test(rawDates)
          ? rawDates
          : `${rawDates}, 2026`
        : "Nov 21–22, 2026";

    const parsedTeamClean = (parsed.teamName || "").trim();
    const resolvedTeamName =
      !isGenericPlaceholderTeam(parsedTeamClean)
        ? parsedTeamClean
        : teamName;

    const rawGames = Array.isArray(parsed.games) ? parsed.games : [];
    const hasOnlyPlaceholders =
      rawGames.length === 0 ||
      rawGames.every(
        (g) =>
          g.isPlaceholder === true ||
          /tbd|pending/i.test(g.tipOff || "") ||
          /game\s*\d+\s*-\s*tbd|tip-off pending/i.test(g.opponent || "")
      );
    const isSchedulePending = Boolean(parsed.schedulePending || hasOnlyPlaceholders);

    const shortCity = resolvedCity.split(",")[0].trim() || "Brampton";
    const gamesOut: ExtractedGame[] =
      isSchedulePending && rawGames.length === 0
        ? [
            {
              day: resolvedDates.split(/[-–]/)[0]?.trim() || "Sat, Nov 21",
              dateStr: "2026-11-21",
              tipOff: "TBD (Tip-Off Pending)",
              arrivalCall: "TBD",
              court: "TBD",
              venueName: `${shortCity} Area Gym (TBD)`,
              venueAddress: resolvedCity,
              opponent: "Game 1 - TBD (Tip-Off Pending)",
              jerseyColor: "White (Home)",
              telemetryTag: "Tip-Off Pending",
              isPlaceholder: true,
            },
            {
              day: resolvedDates,
              dateStr: "2026-11-22",
              tipOff: "TBD (Tip-Off Pending)",
              arrivalCall: "TBD",
              court: "TBD",
              venueName: `${shortCity} Area Gym (TBD)`,
              venueAddress: resolvedCity,
              opponent: "Game 2 - TBD",
              jerseyColor: "Dark / Black (Away)",
              telemetryTag: "Tip-Off Pending",
              isPlaceholder: true,
            },
          ]
        : rawGames;

    const rawHotelName = (parsed.hotel?.name || "").trim();
    const rawHotelAddress = (parsed.hotel?.address || "").trim();
    const isGenericHotelName =
      !rawHotelName || /^team\s*hotel(\s*\(.*\)|\s*tbd)?$/i.test(rawHotelName);
    const isBramptonCity = /brampton/i.test(resolvedCity);

    const hotelPayload = {
      name: !isGenericHotelName
        ? rawHotelName
        : isBramptonCity
          ? "Fairfield Inn & Suites Toronto Brampton"
          : `Team Hotel (${shortCity})`,
      address:
        rawHotelAddress && !/^(tbd|away)$/i.test(rawHotelAddress)
          ? rawHotelAddress
          : isBramptonCity
            ? "150 Westcreek Blvd, Brampton"
            : resolvedCity,
      rate: parsed.hotel?.rate?.trim() || `Team Room Block (${resolvedTeamName})`,
      breakfastHours: parsed.hotel?.breakfastHours?.trim() || "6:30 AM - 9:30 AM (Included)",
      checkoutTime: parsed.hotel?.checkoutTime?.trim() || "12:00 PM",
    };

    const slug = buildUniqueSlug(resolvedTournamentName, shortCity, resolvedTeamName);

    const corridorPlan = computeTravelCorridor(
      "Ottawa, ON",
      resolvedCity,
      hotelPayload.name,
      900,
      gamesOut[0]?.day || resolvedDates,
      {
        direction: "to_tournament",
        teamHomeBase: "Ottawa, ON",
        destinationAddress: hotelPayload.address,
        schedulePending: isSchedulePending,
      }
    );

    const fuelRecommendations = getCityFuelAndFoodRecommendations(
      resolvedCity,
      hotelPayload.address
    );

    const tournamentObject = {
      name: resolvedTournamentName,
      division: "Varsity / Club Division",
      leagueName: resolvedTournamentName,
      teamName: resolvedTeamName,
      dates: resolvedDates,
      city: resolvedCity,
      schedulePending: isSchedulePending,
      primaryHub:
        !isSchedulePending && gamesOut[0]?.venueName
          ? gamesOut[0].venueName
          : hotelPayload.name,
      primaryHubAddress:
        !isSchedulePending && gamesOut[0]?.venueAddress
          ? gamesOut[0].venueAddress
          : hotelPayload.address || resolvedCity,
      lastUpdatedText: isSchedulePending
        ? "Hotel & Logistics Locked • Schedule Pending"
        : `Official ${resolvedTournamentName} Run-Sheet`,
      hotel: hotelPayload,
    };

    // Persist payload to Supabase database & broadcast channel best-effort so `/t/${slug}` resolves across devices
    try {
      const { data: tourneyRow } = await supabase
        .from("tournaments")
        .upsert({ name: resolvedTournamentName }, { onConflict: "name" })
        .select("id")
        .maybeSingle();

      if (tourneyRow?.id) {
        await supabase.from("team_trips").upsert(
          {
            tournament_id: tourneyRow.id,
            team_name: resolvedTeamName,
            hotel_name: hotelPayload.name,
            hotel_address: hotelPayload.address,
            share_slug: slug,
          },
          { onConflict: "share_slug" }
        );
      }
    } catch (dbErr) {
      console.warn("Supabase persistence fallback (non-fatal):", dbErr);
    }

    return NextResponse.json({
      success: true,
      slug,
      schedulePending: isSchedulePending,
      tournamentName: resolvedTournamentName,
      teamName: resolvedTeamName,
      city: resolvedCity,
      dates: resolvedDates,
      hotel: hotelPayload,
      tournament: tournamentObject,
      corridorPlan,
      fuelRecommendations,
      games: gamesOut,
    });
  } catch (err: any) {
    console.error("Error in /api/ingest-schedule:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to analyze schedule file.",
      },
      { status: 500 }
    );
  }
}
