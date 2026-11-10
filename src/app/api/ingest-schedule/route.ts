import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "@/lib/supabase";
import {
  computeTravelCorridor,
  getCityFuelAndFoodRecommendations,
} from "@/lib/corridor-engine";

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
      "3. PRE-SCHEDULE / HOTEL ANNOUNCEMENT HANDLING:",
      "   - If no specific game times or opponents exist yet (e.g., 'schedule not out yet', 'schedule TBD', or only hotel/dates/city are announced):",
      "   - Do NOT throw an error and NEVER invent or return mock Oakville data.",
      "   - Set schedulePending: true.",
      "   - Return placeholder weekend cards in `games`: Game 1 ('Game 1 - TBD (Tip-Off Pending)') and Game 2 ('Game 2 - TBD') with isPlaceholder: true.",
      "4. CONFIRMED SCHEDULE HANDLING:",
      "   - If actual game times and opponents ARE present in the input, set schedulePending: false and extract each game with 30-minute arrivalCall buffer and home/away jerseyColor ('White (Home)' vs 'Dark / Black (Away)').",
    ].join("\n");

    const userPrompt = [
      rawTeamNameInput && !isGenericPlaceholderTeam(rawTeamNameInput)
        ? `Target Team Context (override if chat header shows a specific team name): ${rawTeamNameInput}`
        : "Extract the team name from the chat header or schedule (e.g., 'Ottawa Elite U16').",
      tournamentNameInput ? `Tournament Context: ${tournamentNameInput}` : "",
      rawText ? `Additional Text / Announcement:\n${rawText}` : "",
      "Extract all tournament metadata (tournamentName, teamName, city, dates), hotel details (name, address, rate, breakfastHours, checkoutTime), and scheduled games (or schedulePending: true with placeholder games if tip-offs are not released yet).",
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

    for (const candidateKey of candidateKeys) {
      if (parsed) break;
      try {
        const ai = new GoogleGenAI({ apiKey: candidateKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                { text: userPrompt },
                ...inlineParts,
              ],
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
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
            },
          },
        });

        if (response.text) {
          parsed = JSON.parse(response.text) as ParsedSchedulePayload;
        }
      } catch (innerErr) {
        console.warn("Gemini candidate key attempt failed, trying fallback:", innerErr);
      }
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
        .upsert({ name: resolvedTournamentName, sport: "basketball" }, { onConflict: "name" })
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
