"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    try {
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
