"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface SavedSquadSheet {
  slug: string;
  teamName?: string;
  tournamentName?: string;
  location?: string;
  dates?: string;
  nextGameTipOffMs?: number | null;
  lastVisitedMs?: number;
}

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const rawSheets = localStorage.getItem("awayday_saved_sheets");
      if (rawSheets) {
        const parsed = JSON.parse(rawSheets);
        if (Array.isArray(parsed)) {
          const validSheets = parsed.filter(
            (s: SavedSquadSheet) => s && typeof s.slug === "string" && s.slug.trim() && s.slug !== "test-team"
          );
          if (validSheets.length > 0) {
            const now = Date.now();
            const upcoming = validSheets
              .filter(
                (s: SavedSquadSheet) =>
                  typeof s.nextGameTipOffMs === "number" && s.nextGameTipOffMs >= now - 75 * 60 * 1000
              )
              .sort((a: SavedSquadSheet, b: SavedSquadSheet) => (a.nextGameTipOffMs || 0) - (b.nextGameTipOffMs || 0));

            const chosen =
              upcoming[0] ||
              [...validSheets].sort((a: SavedSquadSheet, b: SavedSquadSheet) => (b.lastVisitedMs || 0) - (a.lastVisitedMs || 0))[0];

            if (chosen?.slug) {
              router.replace(`/t/${encodeURIComponent(chosen.slug)}`);
              return;
            }
          }
        }
      }

      const lastSlug = localStorage.getItem("awayday_last_slug")?.trim();
      if (lastSlug && lastSlug !== "test-team") {
        router.replace(`/t/${encodeURIComponent(lastSlug)}`);
        return;
      }
    } catch {
      // Ignore storage access errors
    }
    router.replace("/claim");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#0B192C] flex items-center justify-center text-xs font-black">
      Loading AwayDay...
    </div>
  );
}
