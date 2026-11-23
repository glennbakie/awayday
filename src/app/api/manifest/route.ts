import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const rawSlug = request.nextUrl.searchParams.get("slug") || "";
  const slug = rawSlug.replace(/[\])}[{(]/g, "").trim();

  const manifest = {
    name: "AwayDay",
    short_name: "AwayDay",
    description: "Games, gyms, hotels, and team plans in one live link. No app download required.",
    start_url: slug ? `/t/${encodeURIComponent(slug)}` : "/",
    scope: "/",
    display: "standalone",
    background_color: "#F8F6F1",
    theme_color: "#0F1E36",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-store",
    },
  });
}
