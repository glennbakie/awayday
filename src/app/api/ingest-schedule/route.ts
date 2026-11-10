import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "@/lib/supabase";

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
  const parts = [tournamentName, city, teamName]
    .map((p) => (p || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean);
  const combined = parts.join("-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return combined || "awayday-team-run-sheet";
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Schedule parser service is not configured on this server." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const rawImages = formData.getAll("images");
    const singleFile = formData.get("file");
    const rawText = (formData.get("text") as string | null)?.trim() || "";
    const allInputs = singleFile ? [...rawImages, singleFile] : rawImages;
    const teamName = (formData.get("teamName") as string | null)?.trim() || "Ottawa Elite";
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
      "You are an expert sports tournament schedule and team logistics parser. Analyze the attached screenshot(s), PDF, or team chat/hotel announcement (which may be from TeamLinkt, WhatsApp/SMS, hotel confirmation emails, North Pole Hoops, CYBL, Tourney Machine, GameSheet, or league brackets).",
      "1. Extract all confirmed games for the target team (or all games if only one team is featured).",
      "2. Determine home vs. away jersey color: 'H' / 'vs' indicate White/Home jersey ('White (Home)'); 'A' / '@' / 'at' indicate Dark/Black/Away jersey ('Dark / Black (Away)').",
      "3. Calculate arrivalCall as exactly 30 minutes prior to tipOff.",
      "4. Also extract tournamentName (e.g. 'CYBL Session'), city (e.g. 'Brampton'), dates (e.g. 'Nov 21–22'), teamName, and hotel details (hotelName, hotelAddress, hotelRate, breakfastHours, checkoutTime) if visible.",
      "5. PRE-SCHEDULE / HOTEL ANNOUNCEMENT HANDLING:",
      "   - If the uploaded image/text is a pre-tournament hotel announcement, room block message, or chat message where no specific game times/opponents exist yet (e.g., 'schedule not out yet', 'schedule TBD', or only hotel/dates/city are mentioned):",
      "   - Do NOT throw an error and NEVER invent or return mock Oakville data.",
      "   - Extract the tournamentName (e.g., 'CYBL Session'), dates (e.g., 'Nov 21–22'), city (e.g., 'Brampton'), and hotel details (e.g., hotelName: 'Fairfield Inn & Suites Toronto Brampton', hotelAddress: '150 Westcreek Blvd, Brampton').",
      "   - Set schedulePending: true.",
      "   - Return placeholder weekend cards in `games` (e.g., opponent: 'Game 1 - TBD (Tip-Off Pending)', tipOff: 'TBD (Tip-Off Pending)', arrivalCall: 'TBD', court: 'TBD', venueName: 'TBD', isPlaceholder: true; and opponent: 'Game 2 - TBD', tipOff: 'TBD (Tip-Off Pending)', arrivalCall: 'TBD', court: 'TBD', venueName: 'TBD', isPlaceholder: true).",
      "   - If actual game times and opponents ARE present in the input, set schedulePending: false and return the real games with isPlaceholder: false.",
    ].join("\n");

    const userPrompt = [
      `Target Team: ${teamName}`,
      tournamentNameInput ? `Tournament Context: ${tournamentNameInput}` : "",
      rawText ? `Additional Text / Announcement:\n${rawText}` : "",
      "Extract all tournament metadata, hotel details, and scheduled games (or pre-schedule pending state if tip-offs are not released yet).",
    ]
      .filter(Boolean)
      .join("\n");

    const ai = new GoogleGenAI({ apiKey });

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

    const responseText = response.text;
    if (!responseText) {
      return NextResponse.json(
        { success: false, error: "Parser returned an empty response." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(responseText) as {
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

    const resolvedTournamentName = parsed.tournamentName?.trim() || tournamentNameInput || "Away Tournament";
    const resolvedCity = parsed.city?.trim() || "TBD";
    const resolvedDates = parsed.dates?.trim() || "Dates TBD";
    const resolvedTeamName = parsed.teamName?.trim() || teamName;

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

    const gamesOut: ExtractedGame[] =
      isSchedulePending && rawGames.length === 0
        ? [
            {
              day: resolvedDates.split(/[-–]/)[0]?.trim() || "Day 1",
              dateStr: "",
              tipOff: "TBD (Tip-Off Pending)",
              arrivalCall: "TBD",
              court: "TBD",
              venueName: resolvedCity !== "TBD" ? `${resolvedCity} Tournament Gym` : "TBD",
              venueAddress: resolvedCity !== "TBD" ? resolvedCity : "",
              opponent: "Game 1 - TBD (Tip-Off Pending)",
              jerseyColor: "White (Home)",
              telemetryTag: "Tip-Off Pending",
              isPlaceholder: true,
            },
            {
              day: resolvedDates.split(/[-–]/)[0]?.trim() || "Day 1",
              dateStr: "",
              tipOff: "TBD (Tip-Off Pending)",
              arrivalCall: "TBD",
              court: "TBD",
              venueName: resolvedCity !== "TBD" ? `${resolvedCity} Tournament Gym` : "TBD",
              venueAddress: resolvedCity !== "TBD" ? resolvedCity : "",
              opponent: "Game 2 - TBD",
              jerseyColor: "Dark / Black (Away)",
              telemetryTag: "Tip-Off Pending",
              isPlaceholder: true,
            },
          ]
        : rawGames;

    const hotelPayload = {
      name: parsed.hotel?.name?.trim() || (resolvedCity !== "TBD" ? `Team Hotel (${resolvedCity})` : "Team Hotel TBD"),
      address: parsed.hotel?.address?.trim() || (resolvedCity !== "TBD" ? resolvedCity : ""),
      rate: parsed.hotel?.rate?.trim() || `Team Room Block (${resolvedTeamName})`,
      breakfastHours: parsed.hotel?.breakfastHours?.trim() || "6:30 AM - 9:30 AM (Check Front Desk)",
      checkoutTime: parsed.hotel?.checkoutTime?.trim() || "12:00 PM",
    };

    const slug = buildUniqueSlug(resolvedTournamentName, resolvedCity, resolvedTeamName);

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
