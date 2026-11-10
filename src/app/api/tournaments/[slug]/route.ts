import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const slug = (resolvedParams?.slug || "").trim();

    if (slug) {
      try {
        // Look up any associated team_trips row for this share_slug
        const { data: tripRow } = await supabase
          .from("team_trips")
          .select("id, tournament_id")
          .eq("share_slug", slug)
          .maybeSingle();

        // Remove any game / hotel / trip records linked to this slug or trip id
        if (tripRow?.id) {
          await supabase.from("games").delete().eq("trip_id", tripRow.id);
          await supabase.from("hotels").delete().eq("trip_id", tripRow.id);
        }

        await supabase.from("games").delete().eq("share_slug", slug);
        await supabase.from("team_trips").delete().eq("share_slug", slug);

        if (tripRow?.tournament_id) {
          await supabase
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
