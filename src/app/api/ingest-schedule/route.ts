import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export interface ExtractedGame {
  day: string;          // e.g. "Saturday, Oct 24"
  dateStr: string;      // e.g. "2026-10-24"
  tipOff: string;       // e.g. "3:45 PM"
  arrivalCall: string;  // e.g. "3:15 PM" (30 min before tip)
  court: string;        // e.g. "Court 2"
  venueName: string;    // e.g. "St. Thomas Aquinas"
  venueAddress?: string;// e.g. "124 Dorval Dr, Oakville, ON"
  opponent: string;     // e.g. "Dragons de Gatineau - Gabriel"
  jerseyColor: "White (Home)" | "Dark / Black (Away)";
  telemetryTag?: string;// e.g. "Home Opener" | "Back-to-Back" | "Morning Tip"
}

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
]);

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
    const allInputs = singleFile ? [...rawImages, singleFile] : rawImages;
    const teamName = (formData.get("teamName") as string | null)?.trim() || "Ottawa Elite (U16)";
    const tournamentName = (formData.get("tournamentName") as string | null)?.trim() || "Tournament Schedule";

    const imageFiles = allInputs.filter((item): item is File => item instanceof File && item.size > 0);

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please attach at least one tournament schedule file (PNG, JPG, WebP, or PDF)." },
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
      "You are an expert sports tournament schedule parser. Analyze the attached schedule screenshot(s) or PDF (which may be from TeamLinkt, North Pole Hoops, Tourney Machine, GameSheet, or league brackets).",
      "Extract all games for the target team (or all games if only one team is featured).",
      "Determine home vs. away jersey color: 'H' / 'vs' indicate White/Home jersey ('White (Home)'); 'A' / '@' / 'at' indicate Dark/Black/Away jersey ('Dark / Black (Away)').",
      "Calculate arrivalCall as exactly 30 minutes prior to tipOff.",
      "Also extract tournamentName, city, and dates if visible.",
      "Return a clean JSON object: { success: true, tournamentName, city, dates, games: ExtractedGame[] }.",
    ].join("\n");

    const userPrompt = `Target Team: ${teamName}\nTournament Context: ${tournamentName}\nExtract all scheduled games in chronological order.`;

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
            tournamentName: { type: Type.STRING, nullable: true },
            city: { type: Type.STRING, nullable: true },
            dates: { type: Type.STRING, nullable: true },
            games: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: 'e.g. "Sat, Oct 24" or "Saturday, Oct 24"' },
                  dateStr: { type: Type.STRING, description: 'YYYY-MM-DD, e.g. "2026-10-24"' },
                  tipOff: { type: Type.STRING, description: '12-hour time string, e.g. "3:45 PM"' },
                  arrivalCall: { type: Type.STRING, description: '30 minutes before tipOff, e.g. "3:15 PM"' },
                  court: { type: Type.STRING, description: 'e.g. "Court 2" or "Rink 1" or "Field 3"' },
                  venueName: { type: Type.STRING, description: 'e.g. "St. Thomas Aquinas"' },
                  venueAddress: { type: Type.STRING, nullable: true, description: 'Street address or city if shown' },
                  opponent: { type: Type.STRING, description: 'Opponent team name, e.g. "Dragons de Gatineau - Gabriel"' },
                  jerseyColor: {
                    type: Type.STRING,
                    enum: ["White (Home)", "Dark / Black (Away)"],
                  },
                  telemetryTag: {
                    type: Type.STRING,
                    nullable: true,
                    description: 'Optional contextual tag such as "Home Opener", "Back-to-Back", "Morning Tip", or "Session Finale"',
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
          required: ["success", "games"],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      return NextResponse.json(
        { success: false, error: "Parser returned an empty response." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(rawText) as {
      success: boolean;
      tournamentName?: string;
      city?: string;
      dates?: string;
      games: ExtractedGame[];
    };

    return NextResponse.json({
      success: true,
      tournamentName: parsed.tournamentName || undefined,
      city: parsed.city || undefined,
      dates: parsed.dates || undefined,
      games: Array.isArray(parsed.games) ? parsed.games : [],
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
