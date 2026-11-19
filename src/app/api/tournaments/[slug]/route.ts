import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const slug = (resolvedParams?.slug || "").trim();
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    // 1. Try looking up tournament by `slug` or `share_slug`
    let tournamentRow: any = null;
    const { data: orRow, error: orErr } = await supabase
      .from("tournaments")
      .select("*")
      .or(`slug.eq.${slug},share_slug.eq.${slug}`)
      .maybeSingle();

    if (!orErr && orRow) {
      tournamentRow = orRow;
    } else {
      const { data: slugRow } = await supabase
        .from("tournaments")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (slugRow) {
        tournamentRow = slugRow;
      }
    }

    // 2. Also look up `team_trips` by `share_slug`
    const { data: tripRow } = await supabase
      .from("team_trips")
      .select("*, tournaments(*)")
      .eq("share_slug", slug)
      .maybeSingle();

    const joinedTourney = tripRow?.tournaments
      ? Array.isArray(tripRow.tournaments)
        ? tripRow.tournaments[0]
        : tripRow.tournaments
      : null;

    const resolvedTourney = tournamentRow || joinedTourney;
    if (!resolvedTourney && !tripRow) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // 3. Look up games from `games` table (by share_slug, trip_id, or tournament_id) or fallback to schedule_json
    let rawGameRows: any[] = [];
    try {
      const { data: bySlugGames } = await supabase
        .from("games")
        .select("*")
        .eq("share_slug", slug);
      if (Array.isArray(bySlugGames) && bySlugGames.length > 0) {
        rawGameRows = bySlugGames;
      }
    } catch {
      // Ignore if share_slug column is absent
    }

    if (rawGameRows.length === 0 && tripRow?.id) {
      try {
        const { data: byTripGames } = await supabase
          .from("games")
          .select("*")
          .eq("trip_id", tripRow.id);
        if (Array.isArray(byTripGames) && byTripGames.length > 0) {
          rawGameRows = byTripGames;
        }
      } catch {
        // Ignore query error
      }
    }

    if (rawGameRows.length === 0 && resolvedTourney?.id) {
      try {
        const { data: byTourneyGames } = await supabase
          .from("games")
          .select("*")
          .eq("tournament_id", resolvedTourney.id);
        if (Array.isArray(byTourneyGames) && byTourneyGames.length > 0) {
          rawGameRows = byTourneyGames;
        }
      } catch {
        // Ignore query error
      }
    }

    if (rawGameRows.length === 0) {
      const jsonGames =
        resolvedTourney?.schedule_json ||
        resolvedTourney?.games ||
        tripRow?.schedule_json;
      if (Array.isArray(jsonGames) && jsonGames.length > 0) {
        rawGameRows = jsonGames;
      }
    }

    const teamLabel = tripRow?.team_name || resolvedTourney?.team_name || "My Team";
    const cityLabel = resolvedTourney?.city || "Brampton, ON";
    const normalizedGames = rawGameRows.map((row: any, idx: number) => {
      const opponent = row.opponent || `Opponent ${idx + 1}`;
      const jerseyColor = row.jersey_color || row.jerseyColor || row.uniform || "White (Home)";
      const isAway = /black|away/i.test(String(jerseyColor));
      const tipOffMinutes =
        typeof row.tipoff_minutes === "number"
          ? row.tipoff_minutes
          : typeof row.tipOffMinutes === "number"
            ? row.tipOffMinutes
            : 600 + idx * 180;
      return {
        id: row.id ? String(row.id) : `db-g-${idx}`,
        gameNumber: row.game_number ?? row.gameNumber ?? idx + 1,
        dayLabel: row.day_label || row.dayLabel || row.day || resolvedTourney?.dates || "Weekend",
        matchup: row.matchup || `${teamLabel} ${isAway ? "at" : "vs"} ${opponent}`,
        opponent,
        tipOffMinutes,
        court: row.court || `Court ${idx + 1}`,
        venueName: row.venue_name || row.venueName || row.venue || "Tournament Venue",
        venueAddress: row.venue_address || row.venueAddress || cityLabel,
        city: row.city || cityLabel,
        warmupBufferMin: row.warmup_buffer_min ?? row.warmupBufferMin ?? 30,
        hotelTravelMin: row.hotel_travel_min ?? row.hotelTravelMin ?? 15,
        status: row.status || "Upcoming",
        jerseyColor,
        telemetryFlag: row.telemetry_flag || row.telemetryFlag || undefined,
        isPlaceholder: Boolean(row.is_placeholder ?? row.isPlaceholder),
      };
    });

    const hasRealGames =
      normalizedGames.length > 0 &&
      normalizedGames.some(
        (g) => !g.isPlaceholder && !/tbd|pending/i.test(String(g.opponent || ""))
      );
    const schedulePending = hasRealGames
      ? false
      : Boolean(resolvedTourney?.schedule_pending ?? true);

    return NextResponse.json({
      tournament: resolvedTourney,
      trip: tripRow || null,
      games: normalizedGames,
      schedulePending,
    });
  } catch (err: any) {
    console.error("Error in GET /api/tournaments/[slug]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch tournament" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const { slug } = resolvedParams;
    const body = await req.json();
    const { is_archived } = body;
    const nextArchived = Boolean(is_archived);

    // Attempt direct update on `tournaments` table by slug
    const { error } = await supabase
      .from("tournaments")
      .update({ is_archived: nextArchived })
      .eq("slug", slug);

    if (error) {
      // Fallback: if `tournaments` uses `team_trips.share_slug`, update via trip lookup
      try {
        const { data: tripRow } = await supabase
          .from("team_trips")
          .select("id, tournament_id")
          .eq("share_slug", slug)
          .maybeSingle();

        if (tripRow?.tournament_id) {
          await supabase
            .from("tournaments")
            .update({ is_archived: nextArchived })
            .eq("id", tripRow.tournament_id);
        }
      } catch (fallbackErr) {
        console.warn("Fallback archive update warning (non-fatal):", fallbackErr);
      }
    }

    return NextResponse.json({ success: true, is_archived: nextArchived });
  } catch (err: any) {
    console.error("Error in PATCH /api/tournaments/[slug]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update archive state" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const slug = (resolvedParams?.slug || "").trim();

    if (slug) {
      try {
        const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
        const serviceOrAnonKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          "";
        const adminSupabase = createClient(supabaseUrl, serviceOrAnonKey, {
          auth: { persistSession: false },
        });

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

        // Look up any associated team_trips row for this share_slug (or id)
        const { data: tripRow } = await adminSupabase
          .from("team_trips")
          .select("id, tournament_id")
          .eq("share_slug", slug)
          .maybeSingle();

        // Look up any associated tournaments row by slug or id
        const { data: tourneyBySlug } = await adminSupabase
          .from("tournaments")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        // Remove any game / hotel / trip records linked to this slug or trip id
        if (tripRow?.id) {
          await adminSupabase.from("games").delete().eq("trip_id", tripRow.id);
          await adminSupabase.from("hotels").delete().eq("trip_id", tripRow.id);
        }

        await adminSupabase.from("games").delete().eq("share_slug", slug);
        await adminSupabase.from("team_trips").delete().eq("share_slug", slug);
        await adminSupabase.from("tournaments").delete().eq("slug", slug);

        if (isUuid) {
          await adminSupabase.from("team_trips").delete().eq("id", slug);
          await adminSupabase.from("tournaments").delete().eq("id", slug);
        }

        if (tripRow?.tournament_id) {
          await adminSupabase
            .from("tournaments")
            .delete()
            .eq("id", tripRow.tournament_id);
        }

        if (tourneyBySlug?.id) {
          await adminSupabase
            .from("team_trips")
            .delete()
            .eq("tournament_id", tourneyBySlug.id);
          await adminSupabase
            .from("tournaments")
            .delete()
            .eq("id", tourneyBySlug.id);
        }
      } catch (dbErr) {
        console.warn("Supabase delete warning (non-fatal):", dbErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /api/tournaments/[slug]:", err);
    return NextResponse.json({ success: true });
  }
}
