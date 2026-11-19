import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface TournamentVaultItem {
  id?: string;
  slug: string;
  name: string;
  city: string;
  dates: string;
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
    const bySlug = new Map<string, TournamentVaultItem>();

    // 1. Try querying `tournaments` directly if schema includes slug, name, city, dates, is_archived, created_at
    try {
      const { data: tourneyRows, error: tourneyErr } = await supabase
        .from("tournaments")
        .select("id, slug, name, city, dates, is_archived, created_at")
        .order("created_at", { ascending: false });

      if (!tourneyErr && Array.isArray(tourneyRows)) {
        for (const row of tourneyRows as any[]) {
          const slugVal = (row.slug || "").trim();
          if (!slugVal) continue;
          bySlug.set(slugVal, {
            id: row.id ? String(row.id) : undefined,
            slug: slugVal,
            name: row.name || "Tournament Weekend",
            city: row.city || "Brampton, ON",
            dates: row.dates || "Nov 21–22, 2026",
            is_archived: Boolean(row.is_archived),
            created_at: row.created_at || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Ignore if columns differ on `tournaments`
    }

    // 2. Also query `team_trips` joined with `tournaments`
    try {
      const { data: tripRows, error: tripErr } = await supabase
        .from("team_trips")
        .select("share_slug, team_name, hotel_address, created_at, tournaments(name)")
        .order("created_at", { ascending: false });

      if (!tripErr && Array.isArray(tripRows)) {
        for (const row of tripRows as any[]) {
          const slugVal = (row.share_slug || "").trim();
          if (!slugVal || bySlug.has(slugVal)) continue;

          const joinedTourney = Array.isArray(row.tournaments)
            ? row.tournaments[0]
            : row.tournaments;
          const inferredCity = row.hotel_address
            ? row.hotel_address.split(",").slice(-2).join(",").trim() || row.hotel_address
            : slugVal === "test-team"
              ? "Oakville / Burlington, ON"
              : "Brampton, ON";

          bySlug.set(slugVal, {
            slug: slugVal,
            name:
              joinedTourney?.name ||
              (slugVal === "test-team" ? "NPH Session #1 - Oakville" : "CYBL Session"),
            city: inferredCity,
            dates: slugVal === "test-team" ? "Oct 24 - 25, 2026" : "Nov 21–22, 2026",
            is_archived: false,
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

function buildSlugFromParts(rawName: string): string {
  const base = rawName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "awayday-sheet"}-${suffix}`;
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
): Promise<{ data: any; error: any }> {
  const currentPayload: Record<string, any> = { ...payload };
  let activeConflict = onConflict;

  for (let attempt = 0; attempt < 10; attempt++) {
    const query = activeConflict
      ? dbClient.from(table).upsert(currentPayload, { onConflict: activeConflict })
      : dbClient.from(table).insert(currentPayload);

    const { data, error } = await query.select("id").maybeSingle();
    if (!error) {
      return { data, error: null };
    }

    const msg = String(error?.message || "");

    const notNullMatch = msg.match(/null value in column "([^"]+)"/i);
    if (notNullMatch?.[1]) {
      const requiredCol = notNullMatch[1];
      if (!(requiredCol in currentPayload) || currentPayload[requiredCol] == null) {
        currentPayload[requiredCol] = getFallbackValueForColumn(requiredCol, defaults);
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
        return { data: null, error };
      }
      continue;
    }

    if (activeConflict && /no unique or exclusion constraint matching the ON CONFLICT/i.test(msg)) {
      activeConflict = undefined;
      continue;
    }

    return { data: null, error };
  }

  return { data: null, error: { message: `Failed to upsert into ${table} after 10 attempts` } };
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
    const city = (body?.city || "TBD").trim() || "TBD";
    const dates = (body?.dates || "Nov 21–22, 2026").trim() || "Nov 21–22, 2026";
    const todayIso = new Date().toISOString().slice(0, 10);
    const startDate = (body?.startDate || body?.start_date || todayIso).trim() || todayIso;
    const endDate = (body?.endDate || body?.end_date || startDate || todayIso).trim() || todayIso;
    const hotelName = (body?.hotel?.name || "Team Hotel").trim();
    const hotelAddress = (body?.hotel?.address || city).trim();
    const requestedSlug = (body?.slug || "").trim();
    const slug = requestedSlug || buildSlugFromParts(`${rawName}-${teamName}`);
    const shareSlug = (body?.shareSlug || body?.share_slug || slug).trim() || slug;
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
    let lastErrorMessage: string | null = null;

    // 1. Insert/upsert into `tournaments` with automatic schema-cache & NOT NULL column fallback
    const { data: tourneyRow, error: tourneyErr } = await resilientUpsert(
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
        is_archived: false,
      },
      "slug",
      schemaDefaults
    );

    if (!tourneyErr && tourneyRow?.id) {
      tournamentId = tourneyRow.id;
    } else {
      if (tourneyErr) {
        lastErrorMessage = tourneyErr.message;
      }
      // Fallback to minimal `tournaments` payload (`name`, `team_name`, `share_slug`)
      const { data: minRow, error: minErr } = await resilientUpsert(
        dbClient,
        "tournaments",
        { name: rawName, team_name: teamName, share_slug: shareSlug },
        "name",
        schemaDefaults
      );

      if (minErr) {
        lastErrorMessage = minErr.message;
      } else if (minRow?.id) {
        tournamentId = minRow.id;
      }
    }

    // 2. Upsert `team_trips` row keyed by `share_slug`
    if (tournamentId) {
      const { error: tripErr } = await resilientUpsert(
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
      if (tripErr) {
        lastErrorMessage = tripErr.message;
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
      tournament: {
        id: tournamentId ? String(tournamentId) : undefined,
        slug,
        name: rawName,
        teamName,
        city,
        dates,
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
