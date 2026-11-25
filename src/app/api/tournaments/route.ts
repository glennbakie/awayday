import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  sortGamesChronologically,
  resolveVenueCity,
  buildIsoTipOffTimestamp,
} from "@/lib/parse-schedule";

export interface TournamentVaultItem {
  id?: string;
  slug: string;
  share_slug?: string;
  name: string;
  team_name?: string;
  city: string;
  dates: string;
  start_date?: string;
  end_date?: string;
  schedule_pending?: boolean;
  is_archived: boolean;
  created_at: string;
}

const SEED_TOURNAMENTS: TournamentVaultItem[] = [
  {
    slug: "test-team",
    name: "NPH Session #1 - Oakville",
    city: "Oakville / Burlington, ON",
    dates: "Oct 24 - 25, 2026",
    is_archived: false,
    created_at: "2026-10-20T12:00:00.000Z",
  },
];

export async function GET() {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceOrAnonKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";
    const dbClient = supabaseUrl && serviceOrAnonKey
      ? createClient(supabaseUrl, serviceOrAnonKey, { auth: { persistSession: false } })
      : supabase;

    const bySlug = new Map<string, TournamentVaultItem>();

    // 1. Query `tournaments` with `*` so schema differences never fail the SELECT
    try {
      const { data: tourneyRows, error: tourneyErr } = await dbClient
        .from("tournaments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25);

      if (!tourneyErr && Array.isArray(tourneyRows)) {
        for (const row of tourneyRows as any[]) {
          const slugVal = (row.slug || row.share_slug || "").trim();
          if (!slugVal) continue;
          const fallbackDates =
            row.dates ||
            (row.start_date && row.end_date
              ? `${row.start_date} – ${row.end_date}`
              : row.start_date || "Nov 21–22, 2026");
          const inferredTourneyCity =
            row.city ||
            (row.hotel_address
              ? row.hotel_address.split(",").slice(-2).join(",").trim() || row.hotel_address
              : "Brampton, ON");
          bySlug.set(slugVal, {
            id: row.id ? String(row.id) : undefined,
            slug: slugVal,
            share_slug: (row.share_slug || slugVal).trim(),
            name: row.name || "Tournament Weekend",
            team_name: row.team_name || undefined,
            city: inferredTourneyCity,
            dates: fallbackDates,
            start_date: row.start_date || undefined,
            end_date: row.end_date || undefined,
            schedule_pending:
              typeof row.schedule_pending === "boolean" ? row.schedule_pending : undefined,
            is_archived: Boolean(row.is_archived),
            created_at: row.created_at || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Ignore query errors
    }

    // 2. Also query `team_trips` joined with `tournaments`
    try {
      const { data: tripRows, error: tripErr } = await dbClient
        .from("team_trips")
        .select("share_slug, team_name, hotel_address, created_at, tournaments(*)")
        .order("created_at", { ascending: false })
        .limit(25);

      if (!tripErr && Array.isArray(tripRows)) {
        for (const row of tripRows as any[]) {
          const slugVal = (row.share_slug || "").trim();
          if (!slugVal) continue;

          const joinedTourney = Array.isArray(row.tournaments)
            ? row.tournaments[0]
            : row.tournaments;
          const existing = bySlug.get(slugVal);
          const inferredCity =
            joinedTourney?.city ||
            (row.hotel_address
              ? row.hotel_address.split(",").slice(-2).join(",").trim() || row.hotel_address
              : slugVal === "test-team"
                ? "Oakville / Burlington, ON"
                : "Brampton, ON");

          if (existing) {
            if (!existing.team_name && row.team_name) existing.team_name = row.team_name;
            continue;
          }

          bySlug.set(slugVal, {
            id: joinedTourney?.id ? String(joinedTourney.id) : undefined,
            slug: slugVal,
            share_slug: slugVal,
            name:
              joinedTourney?.name ||
              (slugVal === "test-team" ? "NPH Session #1 - Oakville" : "CYBL Session"),
            team_name: row.team_name || joinedTourney?.team_name || undefined,
            city: inferredCity,
            dates:
              joinedTourney?.dates ||
              (slugVal === "test-team" ? "Oct 24 - 25, 2026" : "Nov 21–22, 2026"),
            start_date: joinedTourney?.start_date || undefined,
            end_date: joinedTourney?.end_date || undefined,
            schedule_pending:
              typeof joinedTourney?.schedule_pending === "boolean"
                ? joinedTourney.schedule_pending
                : undefined,
            is_archived: Boolean(joinedTourney?.is_archived),
            created_at: row.created_at || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Ignore fallback query errors
    }

    // 3. Ensure seed tournaments are available if not already present
    for (const seed of SEED_TOURNAMENTS) {
      if (!bySlug.has(seed.slug)) {
        bySlug.set(seed.slug, seed);
      }
    }

    const tournaments = Array.from(bySlug.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ tournaments });
  } catch (err: any) {
    console.error("Error in GET /api/tournaments:", err);
    return NextResponse.json({ tournaments: SEED_TOURNAMENTS });
  }
}

function randomSuffix4(): string {
  return Math.random().toString(36).slice(2, 6).padEnd(4, "0");
}

function buildSlugFromParts(rawName: string): string {
  const base = rawName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "awayday-sheet"}-${randomSuffix4()}`;
}

function ensureUniqueSuffixedSlug(rawSlug: string): string {
  const cleaned = rawSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!cleaned) return `awayday-sheet-${randomSuffix4()}`;
  const baseWithoutSuffix = cleaned.replace(/-[a-z0-9]{4}$/, "");
  return `${baseWithoutSuffix}-${randomSuffix4()}`;
}

function getFallbackValueForColumn(
  col: string,
  defaults: { slug: string; teamName: string; name: string }
): any {
  const lower = col.toLowerCase();
  if (lower.includes("slug")) return defaults.slug;
  if (lower === "team_name") return defaults.teamName;
  if (lower === "name" || lower === "title") return defaults.name;
  if (lower.includes("date")) return new Date().toISOString().slice(0, 10);
  if (lower === "games" || lower === "schedule") return [];
  if (lower.includes("json") || lower === "meta") return {};
  return "TBD";
}

async function resilientUpsert(
  dbClient: any,
  table: string,
  payload: Record<string, any>,
  onConflict?: string,
  defaults: { slug: string; teamName: string; name: string } = {
    slug: "awayday-sheet",
    teamName: "Ottawa Elite",
    name: "Weekend Tournament",
  }
): Promise<{ data: any; error: any; finalSlug: string }> {
  const currentPayload: Record<string, any> = { ...payload };
  let activeConflict = onConflict;
  let currentSlug = defaults.slug;

  for (let attempt = 0; attempt < 10; attempt++) {
    const query = activeConflict
      ? dbClient.from(table).upsert(currentPayload, { onConflict: activeConflict })
      : dbClient.from(table).insert(currentPayload);

    const { data, error } = await query.select("id").maybeSingle();
    if (!error) {
      return { data, error: null, finalSlug: currentSlug };
    }

    const msg = String(error?.message || "");

    if (/duplicate key value violates unique constraint/i.test(msg)) {
      currentSlug = ensureUniqueSuffixedSlug(currentSlug);
      if ("slug" in currentPayload) currentPayload.slug = currentSlug;
      if ("share_slug" in currentPayload) currentPayload.share_slug = currentSlug;
      continue;
    }

    const notNullMatch = msg.match(/null value in column "([^"]+)"/i);
    if (notNullMatch?.[1]) {
      const requiredCol = notNullMatch[1];
      if (!(requiredCol in currentPayload) || currentPayload[requiredCol] == null) {
        currentPayload[requiredCol] = getFallbackValueForColumn(requiredCol, {
          ...defaults,
          slug: currentSlug,
        });
        continue;
      }
    }

    const missingMatch = msg.match(/Could not find the '([^']+)' column/i);
    if (missingMatch?.[1] && missingMatch[1] in currentPayload) {
      const missingCol = missingMatch[1];
      delete currentPayload[missingCol];
      if (activeConflict === missingCol) {
        activeConflict = undefined;
      }
      if (Object.keys(currentPayload).length === 0) {
        return { data: null, error, finalSlug: currentSlug };
      }
      continue;
    }

    if (activeConflict && /no unique or exclusion constraint matching the ON CONFLICT/i.test(msg)) {
      activeConflict = undefined;
      continue;
    }

    return { data: null, error, finalSlug: currentSlug };
  }

  return {
    data: null,
    error: { message: `Failed to upsert into ${table} after 10 attempts` },
    finalSlug: currentSlug,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawName = (
      body?.name ||
      body?.tournamentName ||
      body?.parsedTournamentName ||
      "Weekend Tournament"
    ).trim() || "Weekend Tournament";
    const teamName = (
      body?.teamName ||
      body?.parsedTeamName ||
      "Ottawa Elite"
    ).trim() || "Ottawa Elite";
    const city = (body?.city || "Host City").trim() || "Host City";
    const dates = (body?.dateRange || body?.dates || "Tournament Dates TBD").trim() || "Tournament Dates TBD";
    const todayIso = new Date().toISOString().slice(0, 10);
    const startDate = (body?.startDate || body?.start_date || todayIso).trim() || todayIso;
    const endDate = (body?.endDate || body?.end_date || startDate || todayIso).trim() || todayIso;
    const hotelName = (body?.hotel?.name || "").trim();
    const hotelAddress = (body?.hotel?.address || "").trim();
    const requestedSlug = (body?.slug || "").trim();
    let slug = requestedSlug || buildSlugFromParts(`${rawName}-${teamName}`);
    let shareSlug = slug;
    const rawIncomingGames: any[] = Array.isArray(body?.games) ? body.games : [];
    const incomingGames: any[] = sortGamesChronologically(rawIncomingGames);
    const hasRealGames =
      incomingGames.length > 0 &&
      incomingGames.some(
        (g) =>
          !g?.isPlaceholder &&
          !/tbd|pending/i.test(String(g?.tipOff || g?.startTime || "")) &&
          !/game\s*\d+\s*-\s*tbd|tip-off pending/i.test(String(g?.opponent || ""))
      );
    const isSchedulePending = hasRealGames ? false : Boolean(body?.schedulePending);
    const schemaDefaults = { slug, teamName, name: rawName };

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceOrAnonKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";
    const dbClient = supabaseUrl && serviceOrAnonKey
      ? createClient(supabaseUrl, serviceOrAnonKey, { auth: { persistSession: false } })
      : supabase;

    let tournamentId: string | number | undefined;
    let tripId: string | number | undefined;
    let lastErrorMessage: string | null = null;

    // 1. Insert/upsert into `tournaments` with automatic schema-cache & NOT NULL column fallback
    const { data: tourneyRow, error: tourneyErr, finalSlug } = await resilientUpsert(
      dbClient,
      "tournaments",
      {
        team_name: teamName,
        name: rawName,
        slug,
        share_slug: shareSlug,
        city,
        dates,
        start_date: startDate,
        end_date: endDate,
        hotel_name: hotelName,
        hotel_address: hotelAddress,
        hotel_breakfast_hours: body?.hotel?.breakfastHours || "6:30 AM - 9:30 AM (Included)",
        hotel_checkout_time: body?.hotel?.checkoutTime || "12:00 PM",
        schedule_pending: isSchedulePending,
        schedule_json: incomingGames,
        is_archived: false,
      },
      "share_slug",
      schemaDefaults
    );
    slug = finalSlug;
    shareSlug = finalSlug;

    if (!tourneyErr && tourneyRow?.id) {
      tournamentId = tourneyRow.id;
    } else {
      if (tourneyErr) {
        lastErrorMessage = tourneyErr.message;
      }
      // Fallback to minimal `tournaments` payload (`name`, `team_name`, `share_slug`)
      const { data: minRow, error: minErr, finalSlug: minFinalSlug } = await resilientUpsert(
        dbClient,
        "tournaments",
        { name: rawName, team_name: teamName, share_slug: shareSlug },
        "name",
        { ...schemaDefaults, slug }
      );
      slug = minFinalSlug;
      shareSlug = minFinalSlug;

      if (minErr) {
        lastErrorMessage = minErr.message;
      } else if (minRow?.id) {
        tournamentId = minRow.id;
      }
    }

    // 2. Upsert `team_trips` row keyed by `share_slug`
    if (tournamentId) {
      const { data: tripRow, error: tripErr } = await resilientUpsert(
        dbClient,
        "team_trips",
        {
          tournament_id: tournamentId,
          team_name: teamName,
          hotel_name: hotelName,
          hotel_address: hotelAddress,
          share_slug: shareSlug,
        },
        "share_slug",
        schemaDefaults
      );
      if (tripRow?.id) {
        tripId = tripRow.id;
      }
      if (tripErr) {
        lastErrorMessage = tripErr.message;
      }
    }

    // 3. Persist parsed games into `games` table (when provided)
    if (incomingGames.length > 0 && tournamentId) {
      try {
        await dbClient.from("games").delete().eq("tournament_id", tournamentId);
      } catch {
        // Ignore delete errors
      }

      const gameRows = incomingGames.map((g, idx) => {
        const opponent = String(g.opponent || `Opponent ${idx + 1}`).trim();
        const venueName = String(g.venueName || g.venue || hotelName || "Tournament Venue").trim();
        const venueAddress = String(g.venueAddress || hotelAddress || city).trim();
        const court = String(g.court || `Court ${idx + 1}`).trim();
        const tipOffMinutes =
          typeof g.tipOffMinutes === "number" && !Number.isNaN(g.tipOffMinutes)
            ? g.tipOffMinutes
            : 600 + idx * 180;
        const dayLabel = String(g.dayLabel || g.day || dates).trim();
        const tipOffIso = buildIsoTipOffTimestamp(g.dateStr, dayLabel, tipOffMinutes);

        return {
          tournament_id: tournamentId,
          opponent,
          tip_off: tipOffIso,
          court,
          venue_name: venueName,
          venue_address: venueAddress,
          warmup_buffer_min: g.warmupBufferMin ?? 30,
          hotel_travel_min: g.hotelTravelMin ?? 15,
        };
      });

      const { error: gamesError } = await dbClient.from("games").insert(gameRows);
      if (gamesError) {
        console.error("Error inserting games in POST /api/tournaments:", gamesError);
        return NextResponse.json(
          { success: false, error: `Failed to save games: ${gamesError.message}` },
          { status: 500 }
        );
      }
    }

    // 4. Persist full schedule + city/dates/hotel metadata in venue_alerts state row
    if (tournamentId) {
      try {
        await dbClient
          .from("venue_alerts")
          .delete()
          .eq("tournament_id", tournamentId)
          .eq("title", "__awayday_schedule_state__");

        await dbClient.from("venue_alerts").insert({
          tournament_id: tournamentId,
          alert_type: "note",
          title: "__awayday_schedule_state__",
          content: JSON.stringify({
            games: incomingGames,
            meta: {
              city,
              dates,
              hotel: {
                name: hotelName,
                address: hotelAddress,
                rate: body?.hotel?.rate || "",
                breakfastHours: body?.hotel?.breakfastHours || "",
                checkoutTime: body?.hotel?.checkoutTime || "",
              },
            },
          }),
          author: "system",
          upvotes: 0,
        });
      } catch {
        // Ignore state persistence errors
      }
    }

    if (!tournamentId && lastErrorMessage) {
      return NextResponse.json(
        { success: false, error: lastErrorMessage },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slug,
      id: tournamentId ? String(tournamentId) : undefined,
      schedulePending: isSchedulePending,
      gamesCount: incomingGames.length,
      tournament: {
        id: tournamentId ? String(tournamentId) : undefined,
        slug,
        name: rawName,
        teamName,
        city,
        dates,
        schedulePending: isSchedulePending,
        is_archived: false,
      },
    });
  } catch (err: any) {
    console.error("Error in POST /api/tournaments:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create tournament run sheet." },
      { status: 500 }
    );
  }
}
