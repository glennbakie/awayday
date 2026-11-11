export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import RunSheetClient from "./run-sheet-client";

const SEED_OAKVILLE_FALLBACK = {
  slug: "test-team",
  name: "NPH Session #1 - Oakville",
  division: "Grade 11 Tier 2",
  leagueName: "Grade 11 Tier 2 • NPH Showcase",
  teamName: "Ottawa Elite (U16)",
  dates: "Oct 24 - 25, 2026",
  city: "Oakville / Burlington, ON",
  primaryHub: "St. Thomas Aquinas & Notre Dame",
  primaryHubAddress: "124 Dorval Dr, Oakville, ON L6K 2W1",
  lastUpdatedText: "Official NPH Session #1 Weekend Run-Sheet",
  schedulePending: false,
  hotel: {
    name: "Fairfield Inn Toronto Oakville",
    address: "2937 Sherwood Heights Dr, Oakville, ON L6J 7L3",
    rate: "$169 / night (Ottawa Elite Room Block)",
    breakfastHours: "6:30 AM - 9:30 AM (Included)",
    checkoutTime: "12:00 PM",
  },
};

export default async function RunSheetPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  let rawSlug = resolvedParams?.slug || "test-team";
  try {
    rawSlug = decodeURIComponent(rawSlug);
  } catch {
    // Keep rawSlug if URI decoding fails
  }
  const cleanSlug = rawSlug.replace(/[\])}[{(]/g, "").trim() || "test-team";

  // Check Supabase row best-effort; if cleanSlug === 'test-team' and no row is found,
  // never call notFound() — fall back to SEED_OAKVILLE_FALLBACK so /t/test-team is always reachable.
  let seedFallback = cleanSlug === "test-team" ? SEED_OAKVILLE_FALLBACK : undefined;
  try {
    const { data: tripRow } = await supabase
      .from("team_trips")
      .select("id, share_slug, team_name, hotel_name, hotel_address")
      .eq("share_slug", cleanSlug)
      .maybeSingle();

    if (!tripRow && cleanSlug === "test-team") {
      seedFallback = SEED_OAKVILLE_FALLBACK;
    }
  } catch {
    if (cleanSlug === "test-team") {
      seedFallback = SEED_OAKVILLE_FALLBACK;
    }
  }

  return (
    <Suspense
      fallback={
        <div
          style={{ backgroundColor: "#090D16", color: "#F8FAFC", minHeight: "100vh" }}
          className="w-full flex items-center justify-center text-xs font-bold"
        >
          Loading AwayDay Run-Sheet...
        </div>
      }
    >
      <RunSheetClient initialSlug={cleanSlug} seedTournament={seedFallback} />
    </Suspense>
  );
}
