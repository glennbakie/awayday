import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#F8F7F3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://awayday-omega.vercel.app"),
  title: "AwayDay | Your Team's Travel Planner",
  description: "Games, gyms, hotels, and team plans in one live link. No app download required.",
  openGraph: {
    title: "AwayDay | Your Team's Travel Planner",
    description: "Games, gyms, hotels, and team plans in one live link. No app download required.",
    images: ["/awayday-icon.png"],
  },
  twitter: {
    card: "summary",
    title: "AwayDay | Your Team's Travel Planner",
    description: "Games, gyms, hotels, and team plans in one live link. No app download required.",
    images: ["/awayday-icon.png"],
  },
  icons: {
    icon: "/awayday-icon.png",
    apple: "/awayday-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AwayDay",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jakarta.className} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#F8F7F3] text-[#1D2935] antialiased selection:bg-[#D59B42]/25 selection:text-[#1D2935]">
        {children}
      </body>
    </html>
  );
}
