"use client";

import React, { useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, CheckCircle2, FileText, Loader2, X, CalendarDays, MapPin } from "lucide-react";

interface ExtractedClaimGame {
  day: string;
  dateStr: string;
  tipOff: string;
  arrivalCall: string;
  court: string;
  venueName: string;
  venueAddress?: string;
  opponent: string;
  jerseyColor: "White (Home)" | "Dark / Black (Away)";
  telemetryTag?: string;
}

function parseTimeStringToMinutes(timeStr: string, fallbackMinutes = 600): number {
  const timeMatch = (timeStr || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!timeMatch) return fallbackMinutes;
  let h = parseInt(timeMatch[1], 10);
  const m = parseInt(timeMatch[2], 10);
  const mer = (timeMatch[3] || "").toUpperCase();
  if (mer === "PM" && h < 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function formatSlug(rawTeamName: string): string {
  const cleaned = rawTeamName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "ottawa-elite-u16";
}

function ClaimPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawRef = (searchParams.get("ref") || "").trim();
  const ref = rawRef || "AwayDay";

  const [files, setFiles] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [extractedGames, setExtractedGames] = useState<ExtractedClaimGame[] | null>(null);
  const [extractedMeta, setExtractedMeta] = useState<{
    slug?: string;
    schedulePending?: boolean;
    tournamentName?: string;
    city?: string;
    dates?: string;
    hotel?: {
      name?: string;
      address?: string;
      rate?: string;
      breakfastHours?: string;
      checkoutTime?: string;
    };
  }>({});

  const [teamName, setTeamName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const runScheduleExtraction = async (selectedFiles: File[], targetTeam: string) => {
    if (selectedFiles.length === 0) return null;
    setIsParsing(true);
    setParseError(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((f) => formData.append("images", f));
      if (targetTeam.trim()) {
        formData.append("teamName", targetTeam.trim());
      }

      const res = await fetch("/api/ingest-schedule", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Could not read schedule file. Please try another screenshot or PDF.");
      }

      const gamesList: ExtractedClaimGame[] = Array.isArray(data.games) ? data.games : [];
      setExtractedGames(gamesList);
      setExtractedMeta({
        slug: data.slug,
        schedulePending: Boolean(data.schedulePending),
        tournamentName: data.tournamentName,
        city: data.city,
        dates: data.dates,
        hotel: data.hotel,
      });
      return {
        slug: data.slug as string | undefined,
        schedulePending: Boolean(data.schedulePending),
        games: gamesList,
        tournamentName: data.tournamentName as string | undefined,
        city: data.city as string | undefined,
        dates: data.dates as string | undefined,
        hotel: data.hotel as
          | {
              name?: string;
              address?: string;
              rate?: string;
              breakfastHours?: string;
              checkoutTime?: string;
            }
          | undefined,
      };
    } catch (err: any) {
      setParseError(err?.message || "Unable to read the uploaded schedule file.");
      return null;
    } finally {
      setIsParsing(false);
    }
  };

  const handleFilesSelected = async (incomingList: FileList | File[]) => {
    const valid = Array.from(incomingList).filter((f) => {
      const name = (f.name || "").toLowerCase();
      return (
        f.type.startsWith("image/") ||
        f.type === "application/pdf" ||
        name.endsWith(".png") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".webp") ||
        name.endsWith(".pdf")
      );
    });
    if (valid.length === 0) {
      setParseError("Please select a PNG, JPG, WebP screenshot, or PDF schedule.");
      return;
    }
    setFiles(valid);
    await runScheduleExtraction(valid, teamName);
  };

  const handleBuildRunSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setParseError(null);

    const resolvedTeamName = teamName.trim() || "Ottawa Elite U16";

    let currentGames = extractedGames;
    let currentMeta = extractedMeta;

    if ((!currentGames || currentGames.length === 0) && files.length > 0) {
      const result = await runScheduleExtraction(files, resolvedTeamName);
      if (result) {
        currentGames = result.games;
        currentMeta = {
          slug: result.slug,
          schedulePending: result.schedulePending,
          tournamentName: result.tournamentName,
          city: result.city,
          dates: result.dates,
          hotel: result.hotel,
        };
      }
    }

    const isPending = Boolean(
      currentMeta.schedulePending ||
        !currentGames ||
        currentGames.length === 0 ||
        currentGames.every(
          (g: any) =>
            g.isPlaceholder === true ||
            /tbd|pending/i.test(g.tipOff || "") ||
            /game\s*\d+\s*-\s*tbd|tip-off pending/i.test(g.opponent || "")
        )
    );

    const resolvedCity = (currentMeta.city || "Away").trim();
    const resolvedTournamentName = currentMeta.tournamentName || `${resolvedTeamName} Away Weekend`;
    const slug =
      currentMeta.slug ||
      formatSlug(`${resolvedTournamentName}-${resolvedCity}-${resolvedTeamName}`);

    const mappedGames =
      !isPending && currentGames && currentGames.length > 0
        ? currentGames.map((eg, idx) => {
            const tipOffMinutes = parseTimeStringToMinutes(eg.tipOff, 585 + idx * 180);
            const jerseyColor =
              eg.jerseyColor === "Dark / Black (Away)" ? "Dark / Black (Away)" : "White (Home)";
            const isAway = jerseyColor.toLowerCase().includes("away");
            const opponent = (eg.opponent || `Opponent ${idx + 1}`).trim();
            const venueName = (eg.venueName || "Main Tournament Centre").trim();
            const venueAddress = (eg.venueAddress || resolvedCity).trim();

            return {
              id: `claim-g-${Date.now()}-${idx}`,
              gameNumber: idx + 1,
              dayLabel: eg.day || currentMeta.dates || "Day 1",
              matchup: `${resolvedTeamName} ${isAway ? "at" : "vs"} ${opponent}`,
              opponent,
              tipOffMinutes,
              court: eg.court || `Court ${idx + 1}`,
              venueName,
              venueAddress,
              city: resolvedCity,
              warmupBufferMin: 30,
              hotelTravelMin: 15,
              status: "Upcoming" as const,
              jerseyColor,
              telemetryFlag: eg.telemetryTag || (idx === 0 ? "Home Opener" : undefined),
            };
          })
        : [
            {
              id: `pending-g-${Date.now()}-1`,
              gameNumber: 1,
              dayLabel: currentMeta.dates || "Weekend",
              matchup: "Game 1 - TBD (Tip-Off Pending)",
              opponent: "Game 1 - TBD (Tip-Off Pending)",
              tipOffMinutes: 600,
              court: "TBD",
              venueName: `${resolvedCity} Tournament Venue`,
              venueAddress: resolvedCity,
              city: resolvedCity,
              warmupBufferMin: 30,
              hotelTravelMin: 15,
              status: "Upcoming" as const,
              jerseyColor: "White (Home)" as const,
              telemetryFlag: "Tip-Off Pending",
            },
            {
              id: `pending-g-${Date.now()}-2`,
              gameNumber: 2,
              dayLabel: currentMeta.dates || "Weekend",
              matchup: "Game 2 - TBD",
              opponent: "Game 2 - TBD",
              tipOffMinutes: 780,
              court: "TBD",
              venueName: `${resolvedCity} Tournament Venue`,
              venueAddress: resolvedCity,
              city: resolvedCity,
              warmupBufferMin: 30,
              hotelTravelMin: 15,
              status: "Upcoming" as const,
              jerseyColor: "Dark / Black (Away)" as const,
              telemetryFlag: "Tip-Off Pending",
            },
          ];

    const hotelName = currentMeta.hotel?.name || `Team Hotel (${resolvedCity})`;
    const hotelAddress = currentMeta.hotel?.address || resolvedCity;
    const firstVenue = !isPending && mappedGames[0]?.venueName ? mappedGames[0].venueName : hotelName;
    const firstAddress = !isPending && mappedGames[0]?.venueAddress ? mappedGames[0].venueAddress : hotelAddress;

    const tournamentPayload = {
      name: resolvedTournamentName,
      division: "Varsity / Club Division",
      leagueName: resolvedTournamentName,
      teamName: resolvedTeamName,
      dates: currentMeta.dates || "Dates TBD",
      city: resolvedCity,
      schedulePending: isPending,
      primaryHub: firstVenue,
      primaryHubAddress: firstAddress,
      lastUpdatedText: isPending
        ? "Hotel & Logistics Locked • Schedule Pending"
        : "Official Team Weekend Run-Sheet",
      contactInfo: contactInfo.trim() || undefined,
      hotel: {
        name: hotelName,
        address: hotelAddress,
        rate: currentMeta.hotel?.rate || `Team Room Block (${resolvedTeamName})`,
        breakfastHours: currentMeta.hotel?.breakfastHours || "6:30 AM - 9:30 AM (Check Front Desk)",
        checkoutTime: currentMeta.hotel?.checkoutTime || "12:00 PM",
      },
    };

    try {
      const serializedGames = JSON.stringify(mappedGames);
      window.localStorage.setItem(`awayday_games_sprint1_${slug}`, serializedGames);
      window.localStorage.setItem(`awayday_games_nph1_${slug}`, serializedGames);
      window.localStorage.setItem(
        `awayday_cache_${slug}`,
        JSON.stringify({
          tournament: tournamentPayload,
          games: mappedGames,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // Ignore storage access errors
    }

    router.push(`/t/${slug}?admin=true`);
  };

  const claimUrl = `https://awayday-omega.vercel.app/claim?ref=${encodeURIComponent(ref)}`;
  const managerSmsBody = `Hey Coach / Manager! Another team passed us a free AwayDay pass for our next two away tournaments. Drop our schedule screenshot or PDF here to set up our team run-sheet: ${claimUrl}`;

  return (
    <div className="min-h-screen font-sans bg-[#F8F7F3] text-[#1D2935] pb-16">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-[#F8F7F3]/90 backdrop-blur-md px-4 py-3 border-b border-[#DCE1E7]/60">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/t/test-team" className="flex items-baseline select-none tracking-tight">
            <span className="text-[28px] leading-none font-black italic text-[#0B192C] tracking-tight pr-0.5 [-webkit-text-stroke:0.45px_#0B192C]">
              Away
            </span>
            <span className="text-[28px] leading-none font-black italic text-[#D59B42] tracking-tight [-webkit-text-stroke:0.45px_#D59B42]">
              Day.
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF9F0] border border-[#D59B42] text-[#0B192C] text-[11px] font-black tracking-tight">
            <span aria-hidden="true">🎁</span> Club Pass Active
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-5 space-y-4">
        {/* 1. Header Card */}
        <section className="bg-white rounded-[26px] p-5 border-[1.5px] border-[#DCE1E7] shadow-tactile-sm space-y-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7F6F2] border border-[#D1D5DB] text-[#0B192C] text-xs font-black tracking-tight">
            From the {ref || "AwayDay"} family
          </span>

          <h1 className="text-2xl font-black text-[#0B192C] tracking-tight leading-tight">
            Your first two away tournaments are on us.
          </h1>

          <p className="text-xs sm:text-sm font-semibold text-[#5C6B7B] leading-relaxed">
            Built for the coaches, managers, and drivers on the highway every weekend. No credit card, no app store downloads.
          </p>
        </section>

        {/* 2. Upload Schedule Box & 3. Minimal Team Details Form */}
        <form onSubmit={handleBuildRunSheet} className="space-y-4">
          <section className="bg-white rounded-[26px] p-5 border-[1.5px] border-[#DCE1E7] shadow-tactile-sm space-y-3.5">
            <div>
              <h2 className="text-base font-black text-[#0B192C] tracking-tight">
                Set Up Your Weekend Run-Sheet
              </h2>
              <p className="text-xs font-semibold text-[#5C6B7B] mt-1 leading-relaxed">
                Upload your tournament schedule, bracket screenshot, or PDF. We&apos;ll extract your games, courts, and locations automatically.
              </p>
            </div>

            <input
              ref={fileInputRef}
              id="schedule-file-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf,.pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesSelected(e.target.files);
                  e.target.value = "";
                }
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFilesSelected(e.dataTransfer.files);
                }
              }}
              className="w-full border-2 border-dashed border-[#D1D5DB] hover:border-[#0F2942] bg-[#F7F6F2] hover:bg-[#EFEFEA]/70 rounded-2xl p-6 text-center transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2942]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0F2942] text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Upload className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="block text-xs sm:text-sm font-black text-[#0B192C]">
                {files.length > 0
                  ? `${files.length} schedule file${files.length > 1 ? "s" : ""} attached`
                  : "Tap to upload schedule screenshot or PDF"}
              </span>
              <span className="block text-[11px] font-semibold text-[#5C6B7B] mt-1">
                Accepts PNG, JPG, WebP, or PDF
              </span>
            </button>

            {files.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F7F6F2] border border-[#DCE1E7] rounded-xl px-3 py-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#0F2942] shrink-0" aria-hidden="true" />
                  <span className="font-bold text-[#0B192C] truncate">
                    {files.map((f) => f.name).join(", ")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFiles([]);
                    setExtractedGames(null);
                    setParseError(null);
                  }}
                  aria-label="Remove uploaded schedule file"
                  className="p-1 rounded-full hover:bg-[#E2E8F0] text-[#5C6B7B] hover:text-[#0B192C] cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Processing Indicator */}
            {isParsing && (
              <div
                role="status"
                aria-live="polite"
                className="bg-[#F7F6F2] border-[1.5px] border-[#DCE1E7] rounded-2xl p-3.5 flex items-center gap-3"
              >
                <Loader2 className="w-5 h-5 text-[#0F2942] animate-spin shrink-0" aria-hidden="true" />
                <span className="text-xs font-extrabold text-[#0B192C]">
                  Reading game schedule, courts, and locations...
                </span>
              </div>
            )}

            {parseError && (
              <div
                role="alert"
                className="bg-[#FFF9F0] border border-[#D59B42] rounded-2xl p-3 text-xs font-semibold text-[#0B192C]"
              >
                {parseError}
              </div>
            )}

            {/* Extracted Games / Hotel Logistics Preview */}
            {extractedGames && extractedGames.length > 0 && !isParsing && (
              <div className="bg-[#F7F6F2] border-[1.5px] border-[#DCE1E7] rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#0B192C]">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
                    {extractedMeta.schedulePending
                      ? "Hotel & Logistics Extracted (Schedule Pending)"
                      : `${extractedGames.length} Game${extractedGames.length > 1 ? "s" : ""} Extracted`}
                  </span>
                  {extractedMeta.city && (
                    <span className="text-[11px] font-bold text-[#5C6B7B]">
                      {extractedMeta.city}
                    </span>
                  )}
                </div>
                {extractedMeta.hotel?.name && (
                  <div className="bg-white border border-[#DCE1E7] rounded-xl p-2.5 text-xs">
                    <div className="font-black text-[#0F2942] truncate">
                      🏨 {extractedMeta.hotel.name}
                    </div>
                    {extractedMeta.hotel.address && (
                      <div className="text-[11px] font-semibold text-[#5C6B7B] truncate mt-0.5">
                        {extractedMeta.hotel.address}
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">
                  {extractedGames.map((g, i) => (
                    <div
                      key={i}
                      className="bg-white border border-[#DCE1E7] rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-black text-[#0F2942] truncate">
                          {extractedMeta.schedulePending
                            ? g.opponent
                            : `G${i + 1}: ${g.tipOff} vs ${g.opponent}`}
                        </div>
                        <div className="text-[11px] font-semibold text-[#5C6B7B] flex items-center gap-2 mt-0.5 truncate">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 text-[#0F2942]" aria-hidden="true" />
                            {g.day || extractedMeta.dates || "Weekend"}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-[#0F2942]" aria-hidden="true" />
                            {g.venueName} ({g.court})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 3. Minimal Team Details & Submit */}
          <section className="bg-white rounded-[26px] p-5 border-[1.5px] border-[#DCE1E7] shadow-tactile-sm space-y-3.5">
            <div>
              <label
                htmlFor="claim-team-name"
                className="block text-xs font-black uppercase tracking-wider text-[#0B192C] mb-1.5"
              >
                Team Name
              </label>
              <input
                id="claim-team-name"
                type="text"
                required
                placeholder="e.g., Ottawa Elite U16"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                autoComplete="organization"
                className="w-full min-h-[44px] rounded-xl bg-[#F7F6F2] border-[1.5px] border-[#DCE1E7] px-3.5 py-2.5 text-sm font-bold text-[#0B192C] placeholder:text-slate-400 focus:border-[#0F2942] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="claim-contact-info"
                className="block text-xs font-black uppercase tracking-wider text-[#0B192C] mb-1.5"
              >
                Contact Email or Phone
              </label>
              <input
                id="claim-contact-info"
                type="text"
                required
                placeholder="manager@club.ca or (613) 555-0199"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                autoComplete="email"
                className="w-full min-h-[44px] rounded-xl bg-[#F7F6F2] border-[1.5px] border-[#DCE1E7] px-3.5 py-2.5 text-sm font-bold text-[#0B192C] placeholder:text-slate-400 focus:border-[#0F2942] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isParsing || isSubmitting}
              className="min-h-[48px] bg-[#0F2942] hover:bg-[#1A365D] disabled:opacity-60 text-white font-bold text-sm rounded-xl w-full flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              {isSubmitting || isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Reading game schedule, courts, and locations...</span>
                </>
              ) : (
                <span>Build Team Run-Sheet →</span>
              )}
            </button>
          </section>
        </form>

        {/* 4. Parent Option ("Pass to Manager") */}
        <section className="bg-[#F7F6F2] rounded-[26px] p-5 border-[1.5px] border-[#DCE1E7] shadow-xs space-y-3">
          <p className="text-xs font-semibold text-[#1D2935] leading-relaxed">
            Not the team manager? Send this pass to your manager or head coach so they can upload the schedule for the team.
          </p>
          <a
            href={`sms:?&body=${encodeURIComponent(managerSmsBody)}`}
            className="min-h-[44px] w-full rounded-xl bg-white hover:bg-[#EFEFEA] border-[1.5px] border-[#D1D5DB] text-[#0B192C] font-black text-xs flex items-center justify-center gap-2 px-4 py-2.5 transition-colors shadow-2xs"
          >
            <span aria-hidden="true">💬</span>
            <span>Text Pass to Team Manager</span>
          </a>
        </section>
      </main>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F7F3] text-[#0B192C] flex items-center justify-center text-xs font-black">
          Loading Club Pass...
        </div>
      }
    >
      <ClaimPageContent />
    </Suspense>
  );
}
