import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "@/lib/supabase";
import {
  computeTravelCorridor,
  getCityFuelAndFoodRecommendations,
} from "@/lib/corridor-engine";
import { mergeAndDedupeGames, applyPartialTextPatchToGames, resolveVenueCity } from "@/lib/parse-schedule";

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
    return "";
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
    const existingGamesRaw = (formData.get("existingGames") as string | null)?.trim() || "";
    let existingGamesContext: any[] = [];
    if (existingGamesRaw) {
      try {
        const parsedExisting = JSON.parse(existingGamesRaw);
        if (Array.isArray(parsedExisting)) {
          existingGamesContext = parsedExisting;
        }
      } catch {
        // Ignore malformed existingGames JSON
      }
    }

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
      "5. AFTERNOON ROUND-ROBIN / PLAYOFF PLACEHOLDER DETECTION (MANDATORY):",
      "   - Whenever an uploaded schedule image contains an afternoon round-robin, playoff, or championship table (e.g., 'All Games at RCI for Final 2 Round Robin and Playoffs', '12:00PM', '2:40PM C Championship', '4:00PM B Championship', '5:20PM A Championship'), you MUST append a placeholder game entry to `games` even if the user's team name is NOT printed on those seeded lines:",
      "     - opponent: 'Afternoon Round Robin / Playoff TBD (Seeded from Pool Play)'",
      "     - tipOff: earliest afternoon playoff or round-robin time (e.g., '12:00 PM' or '2:40 PM')",
      "     - venueName: secondary gym if specified (e.g., 'RCI (Renfrew Collegiate Institute)')",
      "     - court: 'TBD'",
      "     - telemetryTag: 'SEEDING TBD'",
      "     - isPlaceholder: true",
      "6. MULTI-SCREENSHOT EXHAUSTIVE EXTRACTION & SMART DEDUPLICATION:",
      "   - You may receive 10 to 15+ separate screenshots or PDF pages in a single request (e.g., individual game cards, scrolled schedule views, or multiple days).",
      "   - Inspect EVERY SINGLE attached image from first to last and extract EVERY distinct game shown across ALL images without dropping distinct opponents, dates, or times.",
      "   - If the exact same game (same date, tip-off time, and opponent) appears in two overlapping screenshots, emit it once with the richest venue/court/jersey details.",
    ].join("\n");

    const existingSummary =
      existingGamesContext.length > 0
        ? `Existing Scheduled Games (match by Game # / ordinal like "game one" / "first game", date, time, or opponent if the new text/screenshots update an existing game, e.g. 'game one is now white jerseys' or 'Game 2 moved to Court 3' — preserve the existing opponent/venue/date/time for any unchanged fields and set isPlaceholder: false):\n${existingGamesContext
            .map(
              (g: any, idx: number) =>
                `Game ${g.gameNumber ?? idx + 1}: ${g.dayLabel || g.day || ""} | ${g.opponent || "TBD"} | ${g.court || "TBD"} | ${g.venueName || ""} | ${g.jerseyColor || ""}`
            )
            .join("\n")}`
        : "";

    const userPrompt = [
      rawTeamNameInput && !isGenericPlaceholderTeam(rawTeamNameInput)
        ? `Target Team Context (override if chat header shows a specific team name): ${rawTeamNameInput}`
        : "Extract the team name from the chat header or schedule (e.g., 'Ottawa Elite U16').",
      tournamentNameInput ? `Tournament Context: ${tournamentNameInput}` : "",
      existingSummary,
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
      hostCity?: string;
      dates?: string;
      dateRange?: string;
      isSingleDay?: boolean;
      ocrSummary?: string;
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
        hostCity: { type: Type.STRING, nullable: true, description: 'Host city and province/state, e.g. "Renfrew, ON" or "Mississauga, ON". Never default to Brampton unless Brampton is in the text/image.' },
        dates: { type: Type.STRING, nullable: true },
        dateRange: { type: Type.STRING, nullable: true, description: 'Formatted tournament date(s), e.g. "Fri, Nov 27, 2026" for a 1-day tournament or "Nov 21–22, 2026" for multi-day.' },
        isSingleDay: { type: Type.BOOLEAN, nullable: true, description: 'True when all games occur on the same calendar date.' },
        ocrSummary: { type: Type.STRING, nullable: true, description: 'Brief verbatim summary of section headers, secondary venue notes, and afternoon playoff/round-robin/championship schedules visible in the image(s).' },
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

    const formatFriendlyVisionError = (rawErr: string | null): string => {
      const msg = String(rawErr || "");
      if (/503|UNAVAILABLE|high demand/i.test(msg)) {
        return "Our AI schedule reader is temporarily busy due to high demand. Please tap Extract Schedule again in a few seconds.";
      }
      if (/429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg)) {
        return "AI extraction rate limit reached. Please wait a few seconds and try again.";
      }
      if (/401|403|PERMISSION_DENIED|API key/i.test(msg)) {
        return "AI vision service authentication failed. Please check the configured API key.";
      }
      return "Unable to read the uploaded schedule screenshots right now. Please try again or paste raw schedule text.";
    };

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

      const candidateModels = [
        "gemini-3.1-flash-lite",
        "gemini-flash-lite-latest",
        "gemini-3-flash-preview",
        "gemini-3.1-flash-lite-preview",
        "gemini-flash-latest",
      ];
      let sawTransient = false;

      const tryModel = async (candidateKey: string, modelName: string) => {
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
          if (/503|429|500|UNAVAILABLE|high demand/i.test(errMsg)) {
            sawTransient = true;
          }
          if (!lastGeminiError || !/PERMISSION_DENIED.*Permission denied on the service/i.test(errMsg)) {
            lastGeminiError = errMsg;
          }
          console.warn(`Gemini ${modelName} attempt failed, failing over:`, errMsg.slice(0, 180));
        }
        return null;
      };

      for (const candidateKey of candidateKeys) {
        for (const modelName of candidateModels) {
          const result = await tryModel(candidateKey, modelName);
          if (result) return result;
        }
      }

      if (sawTransient && candidateKeys[0]) {
        await new Promise((r) => setTimeout(r, 500));
        for (const modelName of candidateModels.slice(0, 2)) {
          const retryResult = await tryModel(candidateKeys[0], modelName);
          if (retryResult) return retryResult;
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
          error: formatFriendlyVisionError(lastGeminiError),
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
        hostCity: firstNonEmpty((r) => r.hostCity),
        dates: firstNonEmpty((r) => r.dates),
        dateRange: firstNonEmpty((r) => r.dateRange),
        isSingleDay: firstNonEmpty((r) => r.isSingleDay),
        ocrSummary: batchResults.map((r) => r.ocrSummary).filter(Boolean).join(" ") || undefined,
        hotel: firstNonEmpty((r) => (r.hotel?.name ? r.hotel : undefined)) || batchResults[0].hotel,
        games: finalMergedGames,
      };
    }

    // Regex & chat-text heuristic extraction if rawText is provided or if upstream vision key failed
    if (!parsed) {
      const cityMatch = rawText.match(/(?:in\s+the\s+|location:\s*|-\s*)([A-Za-z\s]+?)(?:\s+area|[.,\n]|$)/i);
      const hotelMatch = rawText.match(/(?:Proposed\s+hotel|Hotel)\s*:\s*([^\n.]+)/i);
      const dateMatch = rawText.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?(?:,?\s*\d{4})?)/i);
      const extractedCity =
        /\brenfrew\b|myfm\s*cent(?:re|er)|\brci\b/i.test(`${rawText} ${tournamentNameInput}`)
          ? "Renfrew, ON"
          : cityMatch?.[1]?.trim() || "";
      const rawHotelLine = hotelMatch?.[1]?.trim() || "";
      const hotelParts = rawHotelLine.split(",").map((s) => s.trim()).filter(Boolean);
      const fallbackHotelName = hotelParts[0] || "";
      const fallbackHotelAddr = hotelParts.length > 1 ? hotelParts.slice(1).join(", ") : "";

      parsed = {
        success: true,
        schedulePending: true,
        tournamentName: tournamentNameInput || "Weekend Tournament",
        teamName,
        city: normalizeCityLabel(extractedCity),
        hostCity: normalizeCityLabel(extractedCity),
        dates: dateMatch?.[1]
          ? /\d{4}/.test(dateMatch[1])
            ? dateMatch[1]
            : `${dateMatch[1]}, 2026`
          : "",
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
        : tournamentNameInput || "Weekend Tournament";

    const parsedTeamClean = (parsed.teamName || "").trim();
    const resolvedTeamName =
      !isGenericPlaceholderTeam(parsedTeamClean)
        ? parsedTeamClean
        : teamName;

    const rawGames = Array.isArray(parsed.games) ? parsed.games : [];
    const partialTextPatch =
      existingGamesContext.length > 0 && rawText
        ? applyPartialTextPatchToGames(rawText, existingGamesContext)
        : null;

    const effectiveRawGames =
      partialTextPatch &&
      (rawGames.length === 0 ||
        rawGames.every(
          (g) =>
            g.isPlaceholder === true ||
            /tbd|pending/i.test(g.tipOff || "") ||
            /game\s*\d+\s*-\s*tbd|tip-off pending/i.test(g.opponent || "")
        ))
        ? partialTextPatch.map((pg: any) => ({
            day: pg.dayLabel || pg.day || "Tournament Day",
            dateStr: pg.dateStr || "",
            tipOff:
              pg.tipOff ||
              (typeof pg.tipOffMinutes === "number"
                ? `${Math.floor(pg.tipOffMinutes / 60) % 12 || 12}:${String(pg.tipOffMinutes % 60).padStart(2, "0")} ${pg.tipOffMinutes >= 720 ? "PM" : "AM"}`
                : "12:00 PM"),
            arrivalCall: pg.arrivalCall || "",
            court: pg.court || "TBD",
            venueName: pg.venueName || "Tournament Venue",
            venueAddress: pg.venueAddress || "",
            opponent: pg.opponent || "Opponent",
            jerseyColor: (pg.jerseyColor === "Dark / Black (Away)" ? "Dark / Black (Away)" : "White (Home)") as "White (Home)" | "Dark / Black (Away)",
            telemetryTag: pg.telemetryTag,
            isPlaceholder: false,
          }))
        : rawGames;

    const firstRealExtracted = effectiveRawGames.find((g) => !g.isPlaceholder) || effectiveRawGames[0];
    const cityFromVenues = firstRealExtracted
      ? resolveVenueCity(firstRealExtracted.venueName, firstRealExtracted.venueAddress, "")
      : "";
    const cityFromNameOrText = /\brenfrew\b|myfm\s*cent(?:re|er)|\brci\b/i.test(
      `${resolvedTournamentName} ${rawText}`
    )
      ? "Renfrew, ON"
      : "";

    const resolvedCity =
      normalizeCityLabel(parsed.hostCity || parsed.city) ||
      cityFromVenues ||
      cityFromNameOrText ||
      "Host City";

    const uniqueGameDays = Array.from(
      new Set(
        effectiveRawGames
          .map((g) => (g.dateStr || g.day || "").trim())
          .filter(Boolean)
      )
    );
    const isSingleDay =
      typeof parsed.isSingleDay === "boolean"
        ? parsed.isSingleDay
        : uniqueGameDays.length === 1;

    const rawDates = (parsed.dateRange || parsed.dates || "").trim();
    const derivedSingleDayLabel =
      effectiveRawGames[0]?.day && effectiveRawGames[0].day.trim()
        ? /\d{4}/.test(effectiveRawGames[0].day)
          ? effectiveRawGames[0].day.trim()
          : `${effectiveRawGames[0].day.trim()}, 2026`
        : "";
    const resolvedDates =
      rawDates && !/^dates\s*tbd$/i.test(rawDates)
        ? /\d{4}/.test(rawDates)
          ? rawDates
          : `${rawDates}, 2026`
        : derivedSingleDayLabel || "Tournament Dates TBD";

    const hasOnlyPlaceholders =
      effectiveRawGames.length === 0 ||
      effectiveRawGames.every(
        (g) =>
          g.isPlaceholder === true ||
          /tbd|pending/i.test(g.tipOff || "") ||
          /game\s*\d+\s*-\s*tbd|tip-off pending/i.test(g.opponent || "")
      );
    const isSchedulePending =
      existingGamesContext.length > 0 && hasOnlyPlaceholders
        ? false
        : Boolean(parsed.schedulePending || hasOnlyPlaceholders);

    const shortCity = resolvedCity.split(",")[0].trim() || "Host City";
    const gamesOut: ExtractedGame[] =
      isSchedulePending && effectiveRawGames.length === 0
        ? [
            {
              day: resolvedDates.split(/[-–]/)[0]?.trim() || "Day 1",
              dateStr: "",
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
              dateStr: "",
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
        : effectiveRawGames;

    // Deterministic post-processing fallback for afternoon playoff / round-robin sessions
    const parseTipOffMinutes = (timeStr?: string): number | null => {
      if (!timeStr) return null;
      const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!m) return null;
      let hrs = parseInt(m[1], 10);
      const mins = parseInt(m[2], 10);
      const meridiem = m[3].toUpperCase();
      if (meridiem === "PM" && hrs < 12) hrs += 12;
      if (meridiem === "AM" && hrs === 12) hrs = 0;
      return hrs * 60 + mins;
    };

    const formatMinutes12h = (totalMinutes: number): string => {
      const norm = ((totalMinutes % 1440) + 1440) % 1440;
      const h24 = Math.floor(norm / 60);
      const mins = norm % 60;
      const meridiem = h24 >= 12 ? "PM" : "AM";
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      return `${h12}:${String(mins).padStart(2, "0")} ${meridiem}`;
    };

    const combinedSignalText = [
      rawText,
      parsed.ocrSummary,
      parsed.tournamentName,
      ...gamesOut.map((g) => `${g.venueName || ""} ${g.opponent || ""} ${g.telemetryTag || ""}`),
    ]
      .filter(Boolean)
      .join(" ");

    const hasAfternoonGameOrPlaceholder = gamesOut.some(
      (g) => g.isPlaceholder === true || (parseTipOffMinutes(g.tipOff) ?? 0) > 12 * 60
    );

    if (
      !isSchedulePending &&
      gamesOut.length > 0 &&
      /playoff|championship|round\s*robin|final\s*2|\brci\b/i.test(combinedSignalText) &&
      !hasAfternoonGameOrPlaceholder
    ) {
      const pmMatches = Array.from(
        combinedSignalText.matchAll(/\b((?:1[0-2]|[1-9]):[0-5]\d\s*PM)\b/gi)
      );
      let earliestAfternoonMins: number | null = null;
      let detectedPlayoffTime = "2:40 PM";
      for (const match of pmMatches) {
        const mins = parseTipOffMinutes(match[1]);
        if (mins !== null && mins > 12 * 60 && (earliestAfternoonMins === null || mins < earliestAfternoonMins)) {
          earliestAfternoonMins = mins;
          detectedPlayoffTime = formatMinutes12h(mins);
        }
      }
      const detectedArrivalCall = formatMinutes12h((earliestAfternoonMins ?? 14 * 60 + 40) - 30);
      const detectedSecondaryVenue = /\brci\b|renfrew\s+collegiate/i.test(combinedSignalText)
        ? "RCI (Renfrew Collegiate Institute)"
        : gamesOut[0]?.venueName || `${shortCity} Area Gym`;

      gamesOut.push({
        day: gamesOut[0]?.day || resolvedDates.split(/[-–]/)[0]?.trim() || "Day 1",
        dateStr: gamesOut[0]?.dateStr || "",
        tipOff: detectedPlayoffTime,
        arrivalCall: detectedArrivalCall,
        court: "TBD",
        venueName: detectedSecondaryVenue,
        venueAddress: /\brci\b|renfrew\s+collegiate/i.test(detectedSecondaryVenue)
          ? "184 Bonnechere St S, Renfrew, ON"
          : gamesOut[0]?.venueAddress || resolvedCity,
        opponent: "Afternoon Round Robin / Playoff TBD (Seeded from Pool Play)",
        jerseyColor: "White (Home)",
        telemetryTag: "SEEDING TBD",
        isPlaceholder: true,
      });
    }

    const rawHotelName = (parsed.hotel?.name || "").trim();
    const rawHotelAddress = (parsed.hotel?.address || "").trim();
    const isGenericHotelName =
      !rawHotelName || /^team\s*hotel(\s*\(.*\)|\s*tbd)?$/i.test(rawHotelName);

    const hotelPayload = {
      name: !isGenericHotelName ? rawHotelName : "",
      address:
        rawHotelAddress && !/^(tbd|away)$/i.test(rawHotelAddress)
          ? rawHotelAddress
          : "",
      rate: parsed.hotel?.rate?.trim() || "",
      breakfastHours: parsed.hotel?.breakfastHours?.trim() || "",
      checkoutTime: parsed.hotel?.checkoutTime?.trim() || "",
    };

    const slug = buildUniqueSlug(resolvedTournamentName, shortCity, resolvedTeamName);

    const corridorPlan = computeTravelCorridor(
      "Ottawa, ON",
      resolvedCity,
      hotelPayload.name || gamesOut[0]?.venueName || resolvedCity,
      900,
      gamesOut[0]?.day || resolvedDates,
      {
        direction: "to_tournament",
        teamHomeBase: "Ottawa, ON",
        destinationAddress: hotelPayload.address || gamesOut[0]?.venueAddress || resolvedCity,
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
      hostCity: resolvedCity,
      dates: resolvedDates,
      dateRange: resolvedDates,
      isSingleDay,
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
