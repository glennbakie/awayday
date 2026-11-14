import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AwayDay | Your Team's Travel Planner",
    short_name: 'AwayDay',
    description: 'Games, gyms, hotels, and team plans in one live link. No app download required.',
    start_url: '/t/test-team',
    display: 'standalone',
    background_color: '#090D16',
    theme_color: '#090D16',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
