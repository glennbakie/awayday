import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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

        // Look up any associated team_trips row for this share_slug
        const { data: tripRow } = await adminSupabase
          .from("team_trips")
          .select("id, tournament_id")
          .eq("share_slug", slug)
          .maybeSingle();

        // Remove any game / hotel / trip records linked to this slug or trip id
        if (tripRow?.id) {
          await adminSupabase.from("games").delete().eq("trip_id", tripRow.id);
          await adminSupabase.from("hotels").delete().eq("trip_id", tripRow.id);
        }

        await adminSupabase.from("games").delete().eq("share_slug", slug);
        await adminSupabase.from("team_trips").delete().eq("share_slug", slug);
        await adminSupabase.from("tournaments").delete().eq("slug", slug);

        if (tripRow?.tournament_id) {
          await adminSupabase
            .from("tournaments")
            .delete()
            .eq("id", tripRow.tournament_id);
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
