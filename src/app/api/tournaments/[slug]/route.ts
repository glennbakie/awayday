import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  sortGamesChronologically,
  resolveVenueCity,
  buildIsoTipOffTimestamp,
  parseTipOffTimestamp,
} from "@/lib/parse-schedule";

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

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceOrAnonKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";
    const dbClient = supabaseUrl && serviceOrAnonKey
      ? createClient(supabaseUrl, serviceOrAnonKey, { auth: { persistSession: false } })
      : supabase;

    // 1. Try looking up tournament by `share_slug` or `slug`
    let tournamentRow: any = null;
    const { data: shareRow, error: shareErr } = await dbClient
      .from("tournaments")
      .select("*")
      .eq("share_slug", slug)
      .maybeSingle();

    if (!shareErr && shareRow) {
      tournamentRow = shareRow;
    } else {
      const { data: slugRow } = await dbClient
        .from("tournaments")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (slugRow) {
        tournamentRow = slugRow;
      }
    }

    // 2. Also look up `team_trips` by `share_slug`
    const { data: tripRow } = await dbClient
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

    // 3. Prefer `schedule_json` when present (it holds full game metadata: status, scores, jerseyColor),
    // and fall back to `games` table rows if `schedule_json` is empty.
    let rawGameRows: any[] = [];
    const jsonGames =
      resolvedTourney?.schedule_json ||
      resolvedTourney?.games ||
      tripRow?.schedule_json;
    if (Array.isArray(jsonGames) && jsonGames.length > 0) {
      rawGameRows = jsonGames;
    }

    if (rawGameRows.length === 0) {
      try {
        const { data: bySlugGames } = await dbClient
          .from("games")
          .select("*")
          .eq("share_slug", slug);
        if (Array.isArray(bySlugGames) && bySlugGames.length > 0) {
          rawGameRows = bySlugGames;
        }
      } catch {
        // Ignore if share_slug column is absent
      }
    }

    if (rawGameRows.length === 0 && tripRow?.id) {
      try {
        const { data: byTripGames } = await dbClient
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
        const { data: byTourneyGames } = await dbClient
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

    const teamLabel = tripRow?.team_name || resolvedTourney?.team_name || "My Team";
    const cityLabel = resolvedTourney?.city || resolvedTourney?.hotel_address || "Brampton, ON";
    const normalizedGames = sortGamesChronologically(
      rawGameRows.map((row: any, idx: number) => {
        const opponent = row.opponent || `Opponent ${idx + 1}`;
        const jerseyColor = row.jersey_color || row.jerseyColor || row.uniform || "White (Home)";
        const isAway = /black|away/i.test(String(jerseyColor));
        const parsedTs = parseTipOffTimestamp(row.tip_off);
        const tipOffMinutes =
          typeof row.tipoff_minutes === "number"
            ? row.tipoff_minutes
            : typeof row.tipOffMinutes === "number"
              ? row.tipOffMinutes
              : typeof parsedTs.tipOffMinutes === "number"
                ? parsedTs.tipOffMinutes
                : 600 + idx * 180;
        const venueName = row.venue_name || row.venueName || row.venue || "Tournament Venue";
        const venueAddress = row.venue_address || row.venueAddress || cityLabel;
        const resolvedGameCity = resolveVenueCity(venueName, venueAddress, row.city || cityLabel);
        return {
          id: row.id ? String(row.id) : `db-g-${idx}`,
          gameNumber: row.game_number ?? row.gameNumber ?? idx + 1,
          dayLabel:
            row.day_label ||
            row.dayLabel ||
            row.day ||
            parsedTs.dayLabel ||
            resolvedTourney?.dates ||
            "Weekend",
          dateStr: row.date_str || row.dateStr || parsedTs.dateStr,
          matchup: row.matchup || `${teamLabel} ${isAway ? "at" : "vs"} ${opponent}`,
          opponent,
          tipOffMinutes,
          court: row.court || `Court ${idx + 1}`,
          venueName,
          venueAddress,
          city: resolvedGameCity,
          warmupBufferMin: row.warmup_buffer_min ?? row.warmupBufferMin ?? 30,
          hotelTravelMin: row.hotel_travel_min ?? row.hotelTravelMin ?? 15,
          status: row.status || "Upcoming",
          teamScore:
            typeof row.teamScore === "number"
              ? row.teamScore
              : typeof row.team_score === "number"
                ? row.team_score
                : null,
          opponentScore:
            typeof row.opponentScore === "number"
              ? row.opponentScore
              : typeof row.opponent_score === "number"
                ? row.opponent_score
                : null,
          jerseyColor,
          telemetryFlag: row.telemetry_flag || row.telemetryFlag || undefined,
          isPlaceholder: Boolean(row.is_placeholder ?? row.isPlaceholder),
        };
      })
    );

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

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const serviceOrAnonKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";
    const dbClient = supabaseUrl && serviceOrAnonKey
      ? createClient(supabaseUrl, serviceOrAnonKey, { auth: { persistSession: false } })
      : supabase;

    // 1. Archive toggle (if provided)
    if (body.is_archived !== undefined) {
      const nextArchived = Boolean(body.is_archived);
      const { error } = await dbClient
        .from("tournaments")
        .update({ is_archived: nextArchived })
        .eq("slug", slug);

      if (error) {
        try {
          const { data: tripRow } = await dbClient
            .from("team_trips")
            .select("id, tournament_id")
            .eq("share_slug", slug)
            .maybeSingle();

          if (tripRow?.tournament_id) {
            await dbClient
              .from("tournaments")
              .update({ is_archived: nextArchived })
              .eq("id", tripRow.tournament_id);
          }
        } catch (fallbackErr) {
          console.warn("Fallback archive update warning (non-fatal):", fallbackErr);
        }
      }
      if (!Array.isArray(body.games)) {
        return NextResponse.json({ success: true, is_archived: nextArchived });
      }
    }

    // 2. Games / schedule update (if provided)
    if (Array.isArray(body.games)) {
      const sortedGames = sortGamesChronologically(body.games);
      const hasRealGames = sortedGames.some(
        (g: any) => !g?.isPlaceholder && !/tbd|pending/i.test(String(g?.opponent || ""))
      );
      const nextPending = hasRealGames ? false : Boolean(body.schedule_pending);

      const { data: tripRow } = await dbClient
        .from("team_trips")
        .select("id, tournament_id, team_name, hotel_name, hotel_address")
        .eq("share_slug", slug)
        .maybeSingle();

      const { data: tourneyRow } = await dbClient
        .from("tournaments")
        .select("*")
        .eq("share_slug", slug)
        .maybeSingle();

      const tournamentId = tripRow?.tournament_id || tourneyRow?.id;

      // Best-effort update on tournaments JSON/pending columns
      if (tournamentId) {
        try {
          await dbClient
            .from("tournaments")
            .update({ schedule_pending: nextPending, schedule_json: sortedGames })
            .eq("id", tournamentId);
        } catch {
          // Ignore if optional columns do not exist
        }
      }

      // Replace games rows for this tournament
      if (!tournamentId) {
        return NextResponse.json(
          { error: `Tournament not found for slug "${slug}"` },
          { status: 404 }
        );
      }

      const { error: deleteGamesErr } = await dbClient
        .from("games")
        .delete()
        .eq("tournament_id", tournamentId);
      if (deleteGamesErr) {
        console.warn("Warning deleting prior games:", deleteGamesErr.message);
      }

      const cityLabel = tourneyRow?.city || tourneyRow?.hotel_address || "Brampton, ON";
      const gameRows = sortedGames.map((g: any, idx: number) => {
        const opponent = String(g.opponent || `Opponent ${idx + 1}`).trim();
        const venueName = String(g.venueName || "Tournament Venue").trim();
        const venueAddress = String(g.venueAddress || cityLabel).trim();
        const tipOffMinutes =
          typeof g.tipOffMinutes === "number" && !Number.isNaN(g.tipOffMinutes)
            ? g.tipOffMinutes
            : 600 + idx * 180;
        const dayLabel = String(g.dayLabel || g.day || tourneyRow?.dates || "Weekend").trim();
        const tipOffIso = buildIsoTipOffTimestamp(g.dateStr, dayLabel, tipOffMinutes);

        return {
          tournament_id: tournamentId,
          opponent,
          tip_off: tipOffIso,
          court: String(g.court || `Court ${idx + 1}`).trim(),
          venue_name: venueName,
          venue_address: venueAddress,
          warmup_buffer_min: g.warmupBufferMin ?? 30,
          hotel_travel_min: g.hotelTravelMin ?? 15,
        };
      });

      if (gameRows.length > 0) {
        const { error: gamesError } = await dbClient.from("games").insert(gameRows);
        if (gamesError) {
          console.error("Error inserting games in PATCH /api/tournaments/[slug]:", gamesError);
          return NextResponse.json(
            { error: `Failed to save games: ${gamesError.message}` },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        games: sortedGames,
        schedulePending: nextPending,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in PATCH /api/tournaments/[slug]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update tournament" },
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
