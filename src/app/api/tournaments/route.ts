import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface TournamentVaultItem {
  slug: string;
  name: string;
  city: string;
  dates: string;
  is_archived: boolean;
  created_at: string;
}

const SEED_TOURNAMENTS: TournamentVaultItem[] = [
  {
    slug: "cybl-brampton-ottawa-elite",
    name: "CYBL Session",
    city: "Brampton, ON",
    dates: "Nov 21–22, 2026",
    is_archived: false,
    created_at: "2026-11-10T12:00:00.000Z",
  },
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
        .select("slug, name, city, dates, is_archived, created_at")
        .order("created_at", { ascending: false });

      if (!tourneyErr && Array.isArray(tourneyRows)) {
        for (const row of tourneyRows as any[]) {
          const slugVal = (row.slug || "").trim();
          if (!slugVal) continue;
          bySlug.set(slugVal, {
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
