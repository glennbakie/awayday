"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CORRIDOR_ORIGIN_PRESETS, computeTravelCorridor } from "@/lib/corridor-engine";
import { 
  Clock, 
  Navigation, 
  Car, 
  AlertCircle, 
  Utensils, 
  Hotel, 
  Trophy, 
  Timer, 
  Plus, 
  X, 
  ThumbsUp, 
  CalendarClock,
  Coffee,
  Users,
  UserCheck,
  CheckCircle2,
  Lock,
  PhoneCall,
  Pizza,
  Sparkles,
  MapPin,
  Shield,
  Radio,
  SlidersHorizontal,
  Building2,
  CalendarDays,
  Zap,
  Salad,
  ChevronDown,
  Pencil,
  Upload,
  Image as ImageIcon,
  Loader2,
  FileText
} from "lucide-react";

interface VenueAlert {
  id: string;
  gameId: string;
  type: "parking" | "gate" | "concessions" | "note";
  title: string;
  content: string;
  author: string;
  upvotes: number;
}

type GameStatus = "Upcoming" | "Warmups" | "Live" | "Final" | "Delayed";
type JerseyColor = "White (Home)" | "Dark / Black (Away)" | "Dark / Away" | "Light / Home";

interface DowntimeWindow {
  duration: string;
  type: string;
  note: string;
}

interface Game {
  id: string;
  dayLabel?: string;
  matchup?: string;
  opponent: string;
  tipOffMinutes: number;
  court: string;
  venueName: string;
  venueAddress: string;
  city: string;
  warmupBufferMin: number;
  hotelTravelMin: number;
  status?: GameStatus;
  jerseyColor?: JerseyColor;
  telemetryFlag?: string;
  downtimeAfter?: DowntimeWindow;
}

interface MealOption {
  id: string;
  name: string;
  type: string;
  totalSeats: number;
  playerCount: number;
  parentCount: number;
  votes: number;
  phone: string;
  address: string;
  isCustom?: boolean;
  isDelivery?: boolean;
  suggestedBy?: string;
}

function RunSheetContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const slug = (params?.slug as string) || "test-team";
  const queryAdminParam = searchParams.get("admin") === "true";
  const [isAdmin, setIsAdmin] = useState<boolean>(queryAdminParam);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Step 1: PWA Home Screen Admin Persistence
  useEffect(() => {
    if (!slug) return;
    const adminStorageKey = `awayday_is_admin_${slug}`;
    try {
      if (queryAdminParam) {
        window.localStorage.setItem(adminStorageKey, "true");
        setIsAdmin(true);
      } else if (window.localStorage.getItem(adminStorageKey) === "true") {
        setIsAdmin(true);
      }
    } catch {
      if (queryAdminParam) setIsAdmin(true);
    }
  }, [slug, queryAdminParam]);

  const handleExitAdmin = () => {
    try {
      window.localStorage.removeItem(`awayday_is_admin_${slug}`);
    } catch {
      // Ignore storage errors
    }
    setIsAdmin(false);
    router.replace(pathname || `/t/${slug}`);
  };

  // Step 2: Any-City Travel Corridor Engine Origin State & Persistence
  const [departureOrigin, setDepartureOrigin] = useState<string>("Ottawa, ON");
  const [isOriginPopoverOpen, setIsOriginPopoverOpen] = useState<boolean>(false);
  const [isCustomOriginMode, setIsCustomOriginMode] = useState<boolean>(false);
  const [customOriginDraft, setCustomOriginDraft] = useState<string>("");

  useEffect(() => {
    if (!slug) return;
    try {
      const savedOrigin = window.localStorage.getItem(`awayday_origin_${slug}`);
      if (savedOrigin && savedOrigin.trim()) {
        setDepartureOrigin(savedOrigin.trim());
      }
    } catch {
      // Ignore storage errors
    }
  }, [slug]);

  const handleSelectOriginPreset = (preset: string) => {
    if (preset === "Custom...") {
      setIsCustomOriginMode(true);
      setCustomOriginDraft(departureOrigin);
      return;
    }
    setIsCustomOriginMode(false);
    setDepartureOrigin(preset);
    setIsOriginPopoverOpen(false);
    try {
      window.localStorage.setItem(`awayday_origin_${slug}`, preset);
    } catch {
      // Ignore storage errors
    }
  };

  const handleApplyCustomOrigin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customOriginDraft.trim();
    if (!cleaned) return;
    setDepartureOrigin(cleaned);
    setIsCustomOriginMode(false);
    setIsOriginPopoverOpen(false);
    try {
      window.localStorage.setItem(`awayday_origin_${slug}`, cleaned);
    } catch {
      // Ignore storage errors
    }
  };

  const tournament = {
    name: "NPH Session #1 - Oakville",
    division: "Grade 11 Tier 2",
    leagueName: "Grade 11 Tier 2 • NPH Showcase",
    teamName: "Ottawa Elite (U16)",
    dates: "Oct 24 - 25, 2026",
    city: "Oakville / Burlington, ON",
    primaryHub: "St. Thomas Aquinas & Notre Dame",
    primaryHubAddress: "124 Dorval Dr, Oakville, ON L6K 2W1",
    lastUpdatedText: "Official NPH Session #1 Weekend Run-Sheet",
    hotel: {
      name: "Fairfield Inn Toronto Oakville",
      address: "2937 Sherwood Heights Dr, Oakville, ON L6J 7L3",
      rate: "$169 / night (Ottawa Elite Room Block)",
      breakfastHours: "6:30 AM - 9:30 AM (Included)",
      checkoutTime: "12:00 PM"
    }
  };

  const coffeeSpots = [
    {
      name: "Tribeca Coffee Co. (Oakville)",
      distance: "4 min drive (1.6 km)",
      type: "Sit Down & Wi-Fi",
      note: "Craft espresso, warm pastries, great parent lounge spot near Dorval",
      address: "Oakville, ON"
    },
    {
      name: "Tim Hortons (Dorval Crossing)",
      distance: "2 min drive (0.8 km)",
      type: "Drive-Thru",
      note: "Right off Dorval Dr & QEW — fast mobile order pickup before tip-off",
      address: "Dorval Dr, Oakville, ON"
    },
    {
      name: "Peach Coffee Co. (Burlington)",
      distance: "5 min drive (2.2 km)",
      type: "Specialty / Fast",
      note: "Close to Notre Dame CSS for Sunday morning coffee run",
      address: "Burlington, ON"
    }
  ];

  const quickLunchSpots = [
    {
      name: "Fortinos Hot Bar & Panini Counter",
      type: "Deli Wraps, Pasta & Salad Bar",
      distance: "4 min drive (1.8 km)",
      note: "Huge fresh hot bar, grilled paninis, fruit & hydration — ideal for Sunday's 2h 45m window.",
      address: "Upper Middle Rd, Burlington, ON"
    },
    {
      name: "Firehouse Subs (Burlington / Oakville)",
      type: "Hot & Cold Subs",
      distance: "5 min drive (2.1 km)",
      note: "Quick hearty subs, easy seating for athletes & parents between Sunday games.",
      address: "Burlington, ON"
    },
    {
      name: "Freshii (Dorval Crossing)",
      type: "Smoothies & Bowls",
      distance: "3 min drive (1.3 km)",
      note: "Fast wraps, protein bowls, energizing smoothies. Order ahead on app.",
      address: "Dorval Dr, Oakville, ON"
    },
    {
      name: "Booster Juice",
      type: "Smoothies & Paninis",
      distance: "3 min drive (1.4 km)",
      note: "Quick athlete fuel & hydration between back-to-back games.",
      address: "Oakville, ON"
    }
  ];

  const [games, setGames] = useState<Game[]>([
    {
      id: "g1",
      dayLabel: "Sat, Oct 24",
      matchup: "Ottawa Elite vs Dragons de Gatineau - Gabriel",
      opponent: "Dragons de Gatineau - Gabriel",
      tipOffMinutes: 945, // 3:45 PM
      court: "Court 2",
      venueName: "St. Thomas Aquinas",
      venueAddress: "124 Dorval Dr",
      city: "Oakville, ON L6K 2W1",
      warmupBufferMin: 30, // 3:15 PM arrival buffer (30m before tip)
      hotelTravelMin: 15,
      status: "Upcoming",
      jerseyColor: "White (Home)",
      telemetryFlag: "Home Opener",
      downtimeAfter: {
        duration: "1h 30m",
        type: "Quick Turnaround (Stay On-Site)",
        note: "Both games on Court 2. Fuel athletes with sideline snacks/hydration between games."
      }
    },
    {
      id: "g2",
      dayLabel: "Sat, Oct 24",
      matchup: "Ottawa Elite at MC Elite White",
      opponent: "MC Elite White",
      tipOffMinutes: 1095, // 6:15 PM
      court: "Court 2",
      venueName: "St. Thomas Aquinas",
      venueAddress: "124 Dorval Dr",
      city: "Oakville, ON L6K 2W1",
      warmupBufferMin: 30, // 5:45 PM arrival buffer (30m before tip)
      hotelTravelMin: 15,
      status: "Upcoming",
      jerseyColor: "Dark / Black (Away)",
      telemetryFlag: "Back-to-Back"
    },
    {
      id: "g3",
      dayLabel: "Sun, Oct 25",
      matchup: "Ottawa Elite at YASO Basketball Academy (Black)",
      opponent: "YASO Basketball Academy (Black)",
      tipOffMinutes: 645, // 10:45 AM
      court: "Court 1",
      venueName: "Notre Dame",
      venueAddress: "2333 Headon Forest Dr",
      city: "Burlington, ON L7M 3X6",
      warmupBufferMin: 30, // 10:15 AM arrival buffer (30m before tip)
      hotelTravelMin: 15,
      status: "Upcoming",
      jerseyColor: "Dark / Black (Away)",
      telemetryFlag: "Morning Tip",
      downtimeAfter: {
        duration: "2h 45m Window",
        type: "Athlete Lunch & Fuel Window",
        note: "Prime window for team lunch and rest before Game 4."
      }
    },
    {
      id: "g4",
      dayLabel: "Sun, Oct 25",
      matchup: "Ottawa Elite vs Kingston Impact",
      opponent: "Kingston Impact",
      tipOffMinutes: 870, // 2:30 PM
      court: "Court 1",
      venueName: "Notre Dame",
      venueAddress: "2333 Headon Forest Dr",
      city: "Burlington, ON L7M 3X6",
      warmupBufferMin: 30, // 2:00 PM arrival buffer (30m before tip)
      hotelTravelMin: 15,
      status: "Upcoming",
      jerseyColor: "White (Home)",
      telemetryFlag: "Session Finale"
    }
  ]);

  const [alerts, setAlerts] = useState<VenueAlert[]>([
    {
      id: "a1",
      gameId: "g1",
      type: "note",
      title: "Pre-Game Arrival Call: 3:15 PM",
      content: "Arrive 30 mins before tip-off at St. Thomas Aquinas (Court 2) in White (Home) jerseys.",
      author: "Team Manager",
      upvotes: 6
    },
    {
      id: "a2",
      gameId: "g2",
      type: "concessions",
      title: "1h 30m On-Site Turnaround",
      content: "Both Saturday games are on Court 2. Pack recovery snacks, electrolytes, and switch to Black (Away) jerseys.",
      author: "Team Manager",
      upvotes: 8
    },
    {
      id: "a3",
      gameId: "g3",
      type: "parking",
      title: "Notre Dame CSS Border Crossing (~15m)",
      content: "Right across the Oakville/Burlington border at 2333 Headon Forest Dr. Arrival call is 10:15 AM (30m before tip) on Court 1.",
      author: "Team Manager",
      upvotes: 5
    },
    {
      id: "a4",
      gameId: "g4",
      type: "concessions",
      title: "2h 45m Athlete Lunch Slot Before Finale",
      content: "Prime recovery and lunch window after the 10:45 AM game before the 2:30 PM Session Finale vs Kingston Impact.",
      author: "Team Manager",
      upvotes: 7
    },
    {
      id: "h1",
      gameId: "hotel",
      type: "concessions",
      title: "Early Grab-and-Go Breakfast",
      content: "Fairfield breakfast starts early; quick grab-and-go before Sunday morning tip-off.",
      author: "Ottawa Elite Block",
      upvotes: 9
    },
    {
      id: "h2",
      gameId: "hotel",
      type: "parking",
      title: "Surface Parking & Highway Access",
      content: "Free surface parking on-site with easy access to QEW/403.",
      author: "Ottawa Elite Block",
      upvotes: 7
    }
  ]);

  const [activeModalGameId, setActiveModalGameId] = useState<string | null>(null);
  const [tipCategory, setTipCategory] = useState<"parking" | "gate" | "concessions" | "note">("parking");
  const [tipTitle, setTipTitle] = useState("");
  const [tipContent, setTipContent] = useState("");
  const [tipAuthor, setTipAuthor] = useState("");

  const [isRestaurantModalOpen, setIsRestaurantModalOpen] = useState(false);
  const [suggestName, setSuggestName] = useState("");
  const [suggestType, setSuggestType] = useState("Casual / Team Seating");
  const [suggestPhone, setSuggestPhone] = useState("");
  const [suggestAuthor, setSuggestAuthor] = useState("");

  const [isVoteLocked, setIsVoteLocked] = useState(false);
  const [pollTestMode, setPollTestMode] = useState<"live" | "open" | "lock_soon" | "locked">("live");
  const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(null);
  const [userParty, setUserParty] = useState({ players: 1, parents: 1 });
  const [userFinalAttendance, setUserFinalAttendance] = useState<"attending" | "declined" | null>(null);

  // Manual test override for Lunch vs. Dinner
  const [manualMealMode, setManualMealMode] = useState<"lunch" | "dinner" | "auto">("auto");

  // Live clock state for Hero Card auto-advance evaluation
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  // Manager Suite State: Quick-Edit Game Drawer & Schedule Ingestion Modal
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editTipOffTime, setEditTipOffTime] = useState("15:45");
  const [editCourtLocation, setEditCourtLocation] = useState("");
  const [editOpponent, setEditOpponent] = useState("");
  const [editStatus, setEditStatus] = useState<GameStatus>("Upcoming");
  const [editJerseyColor, setEditJerseyColor] = useState<JerseyColor>("White (Home)");
  const [editWarmupBuffer, setEditWarmupBuffer] = useState<number>(30);

  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestMode, setIngestMode] = useState<"screenshots" | "text">("screenshots");
  const [ingestImages, setIngestImages] = useState<Array<{ id: string; file: File; previewUrl: string }>>([]);
  const [isAnalyzingScreenshots, setIsAnalyzingScreenshots] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [ingestRawText, setIngestRawText] = useState("");
  const [parsedPreviewGames, setParsedPreviewGames] = useState<Game[] | null>(null);
  const ingestFileInputRef = useRef<HTMLInputElement | null>(null);

  const appendIngestFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;
    setIngestError(null);
    const nextEntries = validFiles.map((file, idx) => ({
      id: `img-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setIngestImages((prev) => [...prev, ...nextEntries]);
  };

  const removeIngestImage = (id: string) => {
    setIngestImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  // Global clipboard paste listener when the ingestion modal is open
  useEffect(() => {
    if (!isIngestModalOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) {
        e.preventDefault();
        setIngestMode("screenshots");
        appendIngestFiles(pastedFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isIngestModalOpen]);

  // Real-time synchronization for Meal Mode, Games & Dinner Poll via Supabase Realtime + Broadcast fallback
  useEffect(() => {
    if (!slug) return;

    const storageMealKey = `awayday_meal_mode_${slug}`;
    const storageGamesKey = `awayday_games_sprint1_${slug}`;
    const storagePollOptionsKey = `awayday_poll_options_v2_${slug}`;
    const storageVotedOptionKey = `awayday_voted_opt_${slug}`;

    // Load any cached local broadcast state immediately
    try {
      const savedMeal = window.localStorage.getItem(storageMealKey);
      if (savedMeal === "lunch" || savedMeal === "dinner" || savedMeal === "auto") {
        setManualMealMode(savedMeal);
      }
      const savedGames = window.localStorage.getItem(storageGamesKey);
      if (savedGames) {
        const parsed = JSON.parse(savedGames);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGames(parsed);
        }
      }
      const savedPoll = window.localStorage.getItem(storagePollOptionsKey);
      if (savedPoll) {
        const parsedPoll = JSON.parse(savedPoll);
        if (Array.isArray(parsedPoll) && parsedPoll.length > 0) {
          setOptions(parsedPoll);
        }
      }
      const savedVotedId = window.localStorage.getItem(storageVotedOptionKey);
      if (savedVotedId) {
        setUserVotedOptionId(savedVotedId);
      }
    } catch {
      // Ignore storage access errors
    }

    // 1. Initial data fetch from Supabase
    async function fetchInitialMealMode() {
      try {
        const { data, error } = await supabase
          .from("team_trips")
          .select("active_meal_mode")
          .eq("share_slug", slug)
          .maybeSingle();

        if (!error && data?.active_meal_mode) {
          setManualMealMode(data.active_meal_mode as "lunch" | "dinner" | "auto");
        }
      } catch (err) {
        console.error("Error fetching initial meal mode:", err);
      }
    }

    fetchInitialMealMode();

    // 2. Realtime channel subscription listening to postgres_changes AND broadcast events
    const channel = supabase
      .channel(`trip_${slug}`, {
        config: { broadcast: { self: false } }
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "team_trips",
          filter: `share_slug=eq.${slug}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.active_meal_mode) {
            setManualMealMode(payload.new.active_meal_mode as "lunch" | "dinner" | "auto");
          }
        }
      )
      .on("broadcast", { event: "meal_mode_sync" }, ({ payload }: any) => {
        const nextMode = payload?.mealMode || payload?.mealType;
        if (nextMode === "lunch" || nextMode === "dinner") {
          setManualMealMode(nextMode);
          try {
            window.localStorage.setItem(storageMealKey, nextMode);
          } catch {
            // Ignore local storage errors
          }
        }
      })
      .on("broadcast", { event: "MEAL_MODE_CHANGED" }, ({ payload }: any) => {
        const nextMode = payload?.mealMode || payload?.mealType;
        if (nextMode === "lunch" || nextMode === "dinner") {
          setManualMealMode(nextMode);
          try {
            window.localStorage.setItem(storageMealKey, nextMode);
          } catch {
            // Ignore local storage errors
          }
        }
      })
      .on("broadcast", { event: "games_sync" }, ({ payload }: any) => {
        if (Array.isArray(payload?.games)) {
          setGames(payload.games);
        }
      })
      .on("broadcast", { event: "poll_options_sync" }, ({ payload }: any) => {
        if (Array.isArray(payload?.options)) {
          setOptions(payload.options);
        }
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    // 3. Browser BroadcastChannel + storage listener for instant cross-tab sync
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel(`awayday_sync_${slug}`);
      bc.onmessage = (ev) => {
        if (
          (ev.data?.type === "MEAL_MODE_CHANGED" || ev.data?.type === "meal_mode_sync") &&
          (ev.data.mealMode === "lunch" || ev.data.mealMode === "dinner" || ev.data.mealType === "lunch" || ev.data.mealType === "dinner")
        ) {
          const nextMode = (ev.data.mealMode || ev.data.mealType) as "lunch" | "dinner";
          setManualMealMode(nextMode);
        }
        if (ev.data?.type === "games_sync" && Array.isArray(ev.data.games)) {
          setGames(ev.data.games);
        }
        if (ev.data?.type === "poll_options_sync" && Array.isArray(ev.data.options)) {
          setOptions(ev.data.options);
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageMealKey && (e.newValue === "lunch" || e.newValue === "dinner" || e.newValue === "auto")) {
        setManualMealMode(e.newValue);
      }
      if (e.key === storageGamesKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setGames(parsed);
        } catch {
          // Ignore malformed storage payload
        }
      }
      if (e.key === storagePollOptionsKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setOptions(parsed);
        } catch {
          // Ignore malformed storage payload
        }
      }
      if (e.key === storageVotedOptionKey) {
        setUserVotedOptionId(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Clean up subscriptions on component unmount
    return () => {
      realtimeChannelRef.current = null;
      supabase.removeChannel(channel);
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [slug]);

  const [options, setOptions] = useState<MealOption[]>([
    { 
      id: "p1", 
      name: "Beertown Public House (Oakville)", 
      type: "Team Sit-Down", 
      totalSeats: 14,
      playerCount: 8, 
      parentCount: 6, 
      votes: 8,
      phone: "(905) 849-8696",
      address: "271 Cornwall Rd, Oakville, ON"
    },
    { 
      id: "p2", 
      name: "Scaddabush Italian Kitchen (Oakville)", 
      type: "Pasta & Team Tables", 
      totalSeats: 19,
      playerCount: 11, 
      parentCount: 8, 
      votes: 11,
      phone: "(905) 829-0070",
      address: "2095 Winston Park Dr, Oakville, ON"
    },
    { 
      id: "p3", 
      name: "State & Main Kitchen (Oakville)", 
      type: "Casual / Group Seating", 
      totalSeats: 7,
      playerCount: 4, 
      parentCount: 3, 
      votes: 4,
      phone: "(289) 291-0022",
      address: "478 Dundas St W, Oakville, ON"
    }
  ]);

  const formatTime = (totalMinutes: number) => {
    let normalized = (totalMinutes + 1440) % 1440;
    const hours24 = Math.floor(normalized / 60);
    const mins = normalized % 60;
    const ampm = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${mins < 10 ? "0" : ""}${mins} ${ampm}`;
  };

  const getMapsUrl = (address: string) => {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
  };

  const shiftGameTime = (gameId: string, deltaMinutes: number) => {
    setGames(prev => {
      const updated = prev.map(g => {
        if (g.id !== gameId) return g;
        return { ...g, tipOffMinutes: g.tipOffMinutes + deltaMinutes };
      });
      broadcastGamesSync(updated);
      return updated;
    });
  };

  const minutesToTimeInput = (totalMinutes: number) => {
    const normalized = (totalMinutes + 1440) % 1440;
    const hours24 = Math.floor(normalized / 60);
    const mins = normalized % 60;
    return `${hours24 < 10 ? "0" : ""}${hours24}:${mins < 10 ? "0" : ""}${mins}`;
  };

  const timeInputToMinutes = (timeStr: string) => {
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr || "0", 10);
    const m = parseInt(mStr || "0", 10);
    if (isNaN(h) || isNaN(m)) return 600;
    return h * 60 + m;
  };

  const getArrivalCallMinutes = (tipOffTime: number, bufferMinutes = 30) => {
    const arrivalCallTime = tipOffTime - (bufferMinutes || 30);
    return arrivalCallTime;
  };

  const broadcastGamesSync = async (updatedGames: Game[]) => {
    try {
      const serialized = JSON.stringify(updatedGames);
      window.localStorage.setItem(`awayday_games_nph1_${slug}`, serialized);
      window.localStorage.setItem(`awayday_games_sprint1_${slug}`, serialized);
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel(`awayday_sync_${slug}`);
        bc.postMessage({ type: "games_sync", games: updatedGames });
        bc.close();
      }
      const ch = realtimeChannelRef.current || supabase.channel(`trip_${slug}`);
      await ch.send({
        type: "broadcast",
        event: "games_sync",
        payload: { games: updatedGames }
      });
    } catch (err) {
      console.error("Failed to broadcast games update:", err);
    }
  };

  const broadcastPollOptionsSync = async (updatedOptions: MealOption[], nextVotedId?: string | null) => {
    try {
      window.localStorage.setItem(`awayday_poll_options_v2_${slug}`, JSON.stringify(updatedOptions));
      if (nextVotedId !== undefined) {
        if (nextVotedId) {
          window.localStorage.setItem(`awayday_voted_opt_${slug}`, nextVotedId);
        } else {
          window.localStorage.removeItem(`awayday_voted_opt_${slug}`);
        }
      }
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel(`awayday_sync_${slug}`);
        bc.postMessage({ type: "poll_options_sync", options: updatedOptions });
        bc.close();
      }
      const ch = realtimeChannelRef.current || supabase.channel(`trip_${slug}`);
      await ch.send({
        type: "broadcast",
        event: "poll_options_sync",
        payload: { options: updatedOptions }
      });
    } catch (err) {
      console.error("Failed to broadcast poll options update:", err);
    }
  };

  const isGameElapsedByClock = (game: Game, currentMs: number) => {
    if (game.status === "Final") return true;

    const nowDate = new Date(currentMs);
    const currentMonth = nowDate.getMonth(); // 9 = Oct
    const currentDay = nowDate.getDate();
    const currentMinutesOfDay = nowDate.getHours() * 60 + nowDate.getMinutes();

    const dayMatch = (game.dayLabel || "").match(/Oct\s+(\d+)/i);
    if (!dayMatch) return false;

    const gameDay = parseInt(dayMatch[1], 10);
    // Only auto-expire by clock when the live date is one of the active tournament days (Oct 24 or Oct 25)
    if (currentMonth === 9 && (currentDay === 24 || currentDay === 25)) {
      if (currentDay > gameDay) return true;
      if (currentDay === gameDay && currentMinutesOfDay >= game.tipOffMinutes + 75) {
        return true;
      }
    }
    return false;
  };

  const handleMarkFinalAndAdvance = async (gameId: string) => {
    const updatedGames = games.map((g) =>
      g.id === gameId ? { ...g, status: "Final" as GameStatus } : g
    );
    setGames(updatedGames);
    await broadcastGamesSync(updatedGames);

    try {
      await supabase
        .from("games")
        .update({ status: "Final" })
        .eq("id", gameId);
    } catch (err) {
      console.error("Supabase mark final fallback:", err);
    }
  };

  const handleResetGamesStatus = async () => {
    const updatedGames = games.map((g) => ({ ...g, status: "Upcoming" as GameStatus }));
    setGames(updatedGames);
    await broadcastGamesSync(updatedGames);
  };

  const openEditDrawer = (game: Game) => {
    setEditingGame(game);
    setEditTipOffTime(minutesToTimeInput(game.tipOffMinutes));
    setEditCourtLocation(`${game.court} • ${game.venueName}`);
    setEditOpponent(game.opponent);
    setEditStatus(game.status || "Upcoming");
    setEditJerseyColor(game.jerseyColor || "White (Home)");
    setEditWarmupBuffer(game.warmupBufferMin || 30);
  };

  const handleSaveGameEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;

    const parts = editCourtLocation.split("•").map(s => s.trim());
    const nextCourt = parts[0] || editingGame.court;
    const nextVenue = parts[1] || editingGame.venueName;
    const nextTipOff = timeInputToMinutes(editTipOffTime);
    const nextOpponent = editOpponent.trim() || editingGame.opponent;

    const updatedGames = games.map(g => {
      if (g.id !== editingGame.id) return g;
      const isAway = editJerseyColor.toLowerCase().includes("black") || editJerseyColor.toLowerCase().includes("away");
      return {
        ...g,
        tipOffMinutes: nextTipOff,
        warmupBufferMin: editWarmupBuffer,
        court: nextCourt,
        venueName: nextVenue,
        opponent: nextOpponent,
        matchup: `Ottawa Elite ${isAway ? "at" : "vs"} ${nextOpponent}`,
        status: editStatus,
        jerseyColor: editJerseyColor
      };
    });

    setGames(updatedGames);
    setEditingGame(null);
    await broadcastGamesSync(updatedGames);

    try {
      await supabase
        .from("games")
        .update({
          opponent: editOpponent.trim() || editingGame.opponent,
          court: nextCourt,
          venue_name: nextVenue,
          status: editStatus,
          jersey_color: editJerseyColor
        })
        .eq("id", editingGame.id);
    } catch (err) {
      console.error("Supabase game update fallback:", err);
    }
  };

  const handleParseSchedule = () => {
    const lines = ingestRawText
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setParsedPreviewGames([
        {
          id: `g-${Date.now()}-1`,
          opponent: "Toronto Bounce U16",
          tipOffMinutes: 570, // 9:30 AM
          court: "Court 2",
          venueName: tournament.primaryHub,
          venueAddress: "1125 Colonel By Dr",
          city: tournament.city,
          warmupBufferMin: 30,
          hotelTravelMin: 25,
          status: "Upcoming",
          jerseyColor: "Dark / Away"
        },
        {
          id: `g-${Date.now()}-2`,
          opponent: "Hamilton Huskies",
          tipOffMinutes: 840, // 2:00 PM
          court: "Court 1",
          venueName: tournament.primaryHub,
          venueAddress: "1125 Colonel By Dr",
          city: tournament.city,
          warmupBufferMin: 30,
          hotelTravelMin: 25,
          status: "Upcoming",
          jerseyColor: "Light / Home"
        }
      ]);
      return;
    }

    const parsed: Game[] = lines.map((line, idx) => {
      const timeMatch = line.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      let mins = 600 + idx * 240;
      if (timeMatch) {
        let h = parseInt(timeMatch[1], 10);
        const m = parseInt(timeMatch[2], 10);
        const mer = (timeMatch[3] || "").toUpperCase();
        if (mer === "PM" && h < 12) h += 12;
        if (mer === "AM" && h === 12) h = 0;
        mins = h * 60 + m;
      }

      const courtMatch = line.match(/Court\s*\d+/i);
      const court = courtMatch ? courtMatch[0] : `Court ${idx + 1}`;

      const vsMatch = line.match(/(?:vs\.?|versus|-)\s*([^,|•]+)/i);
      const opponent = vsMatch ? vsMatch[1].trim() : line.replace(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i, "").replace(/Court\s*\d+/i, "").replace(/[-|,•]/g, " ").trim() || `Opponent ${idx + 1}`;

      return {
        id: `ingested-${Date.now()}-${idx}`,
        opponent,
        tipOffMinutes: mins,
        court,
        venueName: tournament.primaryHub,
        venueAddress: "1125 Colonel By Dr",
        city: tournament.city,
        warmupBufferMin: 30,
        hotelTravelMin: 25,
        status: "Upcoming",
        jerseyColor: idx % 2 === 0 ? "Dark / Away" : "Light / Home"
      };
    });

    setParsedPreviewGames(parsed);
  };

  const parseTimeStringToMinutes = (timeStr: string, fallbackMinutes = 600) => {
    const timeMatch = (timeStr || "").match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!timeMatch) return fallbackMinutes;
    let h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2], 10);
    const mer = (timeMatch[3] || "").toUpperCase();
    if (mer === "PM" && h < 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };

  const handleAnalyzeScreenshots = async () => {
    if (ingestImages.length === 0) {
      setIngestError("Please drop, paste, or select at least one tournament screenshot first.");
      return;
    }

    setIsAnalyzingScreenshots(true);
    setIngestError(null);

    try {
      const formData = new FormData();
      ingestImages.forEach((item) => {
        formData.append("images", item.file);
      });
      formData.append("teamName", tournament.teamName);
      formData.append("tournamentName", tournament.name);

      const res = await fetch("/api/ingest-schedule", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to analyze schedule screenshots.");
      }

      const extracted = Array.isArray(data.games) ? data.games : [];
      if (extracted.length === 0) {
        setIngestError("No games were detected in the uploaded screenshot(s). Try a clearer image or use Raw Text.");
        setIsAnalyzingScreenshots(false);
        return;
      }

      const mappedGames: Game[] = extracted.map((eg: any, idx: number) => {
        const tipMins = parseTimeStringToMinutes(eg.tipOff, 600 + idx * 180);
        const jersey: JerseyColor =
          eg.jerseyColor === "Dark / Black (Away)" ? "Dark / Black (Away)" : "White (Home)";
        const isAway = jersey.toLowerCase().includes("black") || jersey.toLowerCase().includes("away");
        const opponent = (eg.opponent || `Opponent ${idx + 1}`).trim();
        const venueName = (eg.venueName || tournament.primaryHub).trim();
        const isNotreDame = venueName.toLowerCase().includes("notre dame");

        return {
          id: `ai-game-${Date.now()}-${idx}`,
          dayLabel: eg.day || "Sat, Oct 24",
          matchup: `Ottawa Elite ${isAway ? "at" : "vs"} ${opponent}`,
          opponent,
          tipOffMinutes: tipMins,
          court: eg.court || `Court ${idx + 1}`,
          venueName,
          venueAddress: isNotreDame ? "2333 Headon Forest Dr" : "124 Dorval Dr",
          city: isNotreDame ? "Burlington, ON L7M 3X6" : "Oakville, ON L6K 2W1",
          warmupBufferMin: 30,
          hotelTravelMin: 15,
          status: "Upcoming",
          jerseyColor: jersey,
          telemetryFlag: eg.telemetryTag || (idx === 0 ? "Home Opener" : undefined),
        };
      });

      setParsedPreviewGames(mappedGames);
    } catch (err: any) {
      console.error("Screenshot ingestion error:", err);
      setIngestError(err?.message || "Failed to analyze screenshots with AI.");
    } finally {
      setIsAnalyzingScreenshots(false);
    }
  };

  const updatePreviewGame = (gameId: string, patch: Partial<Pick<Game, "opponent" | "court">>) => {
    setParsedPreviewGames((prev) => {
      if (!prev) return prev;
      return prev.map((g) => {
        if (g.id !== gameId) return g;
        const nextOpponent = patch.opponent !== undefined ? patch.opponent : g.opponent;
        const nextCourt = patch.court !== undefined ? patch.court : g.court;
        const isAway = (g.jerseyColor || "").toLowerCase().includes("black") || (g.jerseyColor || "").toLowerCase().includes("away");
        return {
          ...g,
          opponent: nextOpponent,
          court: nextCourt,
          matchup: `Ottawa Elite ${isAway ? "at" : "vs"} ${nextOpponent}`,
        };
      });
    });
  };

  const handleApplyIngestedSchedule = async () => {
    if (!parsedPreviewGames || parsedPreviewGames.length === 0) return;
    setGames(parsedPreviewGames);
    await broadcastGamesSync(parsedPreviewGames);
    setParsedPreviewGames(null);
    setIngestRawText("");
    ingestImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setIngestImages([]);
    setIngestError(null);
    setIsIngestModalOpen(false);
  };

  const [activeTab, setActiveTab] = useState<"schedule" | "fuel" | "hotel">("schedule");
  const [openTipsGameId, setOpenTipsGameId] = useState<string | null>(null);

  // Reset scroll to the top of the screen whenever the tab changes (no anchor scrolling)
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Time calculations (Sunday Game 3 -> Game 4 is the 2h 45m Lunch Window; Saturday post-Game 2 is Dinner)
  const lunchGameStart = games[2] || games[0];
  const lunchGameNext = games[3] || games[1] || games[0];
  const game1EndMinutes = lunchGameStart.tipOffMinutes + 60; // ~11:45 AM Sunday
  const game2WarmupMinutes = lunchGameNext.tipOffMinutes; // 2:30 PM Sunday (2h 45m window)
  const game2EndMinutes = (games[1] || games[0]).tipOffMinutes + 75; // ~7:30 PM Saturday after 6:15 PM game

  // Evening block reference: 9:30 PM (1290 mins) wind-down / hotel return
  const eveningEndMinutes = Math.max(1290, game2EndMinutes + 120);

  // LUNCH vs DINNER DETERMINATION
  const gapMidpointMinutes = Math.floor((game1EndMinutes + game2WarmupMinutes) / 2);
  const autoIsLunch = gapMidpointMinutes >= 720 && gapMidpointMinutes <= 960;
  const isLunch = manualMealMode === "auto" ? autoIsLunch : manualMealMode === "lunch";

  // Context-aware downtime calculations based on mode:
  const activeWindowStart = isLunch ? game1EndMinutes : game2EndMinutes;
  const activeWindowEnd = isLunch ? game2WarmupMinutes : eveningEndMinutes;
  const totalWindowMinutes = Math.max(0, activeWindowEnd - activeWindowStart);
  const windowHours = Math.floor(totalWindowMinutes / 60);
  const windowRemainingMins = totalWindowMinutes % 60;

  // Vote closing time: for lunch it's midday; for dinner it locks before Game 2 starts
  const voteClosingMinutes = isLunch ? (game1EndMinutes - 30) : ((games[1] || games[0]).tipOffMinutes - 30);

  // Evaluate Poll Lock & Lock-Soon state from Live Clock or Manager Poll Time-Travel Toggle
  const liveClockDate = new Date(nowMs);
  const liveClockMinutes = liveClockDate.getHours() * 60 + liveClockDate.getMinutes();
  const isTournamentWeekendDay =
    liveClockDate.getMonth() === 9 && (liveClockDate.getDate() === 24 || liveClockDate.getDate() === 25);
  const liveClockLocked = isVoteLocked || (isTournamentWeekendDay && liveClockMinutes >= voteClosingMinutes);
  const liveClockLockSoon =
    !liveClockLocked &&
    (!isTournamentWeekendDay || (liveClockMinutes >= voteClosingMinutes - 90 && liveClockMinutes < voteClosingMinutes));

  const isPollLocked =
    pollTestMode === "locked"
      ? true
      : pollTestMode === "open" || pollTestMode === "lock_soon"
        ? false
        : liveClockLocked;

  const isPollLockSoon =
    pollTestMode === "lock_soon"
      ? true
      : pollTestMode === "open" || pollTestMode === "locked"
        ? false
        : liveClockLockSoon;

  const handleVote = (targetId: string) => {
    if (isPollLocked) return;
    // Prevent spamming votes on the already-selected option
    if (userVotedOptionId === targetId) return;

    const total = userParty.players + userParty.parents;
    const previousVotedId = userVotedOptionId;

    const updatedOptions = options.map(opt => {
      if (previousVotedId && opt.id === previousVotedId) {
        return {
          ...opt,
          votes: Math.max(0, opt.votes - 1),
          totalSeats: Math.max(0, opt.totalSeats - total),
          playerCount: Math.max(0, opt.playerCount - userParty.players),
          parentCount: Math.max(0, opt.parentCount - userParty.parents)
        };
      }
      if (opt.id === targetId) {
        return {
          ...opt,
          votes: opt.votes + 1,
          totalSeats: opt.totalSeats + total,
          playerCount: opt.playerCount + userParty.players,
          parentCount: opt.parentCount + userParty.parents
        };
      }
      return opt;
    });

    setOptions(updatedOptions);
    setUserVotedOptionId(targetId);
    broadcastPollOptionsSync(updatedOptions, targetId);
  };

  const handleSelectOption = handleVote;

  const handleAddCustomRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestName.trim()) return;

    const newId = `custom-${Date.now()}`;
    const userTotal = userParty.players + userParty.parents;

    const newOption: MealOption = {
      id: newId,
      name: suggestName.trim(),
      type: suggestType,
      totalSeats: userTotal,
      playerCount: userParty.players,
      parentCount: userParty.parents,
      votes: 1,
      phone: suggestPhone.trim() || "(905) 555-0100",
      address: "Oakville, ON",
      isCustom: true,
      suggestedBy: suggestAuthor.trim() || "Parent"
    };

    const cleaned = options.map(opt => {
      if (opt.id === userVotedOptionId) {
        return {
          ...opt,
          votes: Math.max(0, opt.votes - 1),
          totalSeats: Math.max(0, opt.totalSeats - userTotal),
          playerCount: Math.max(0, opt.playerCount - userParty.players),
          parentCount: Math.max(0, opt.parentCount - userParty.parents)
        };
      }
      return opt;
    });
    const updatedOptions = [...cleaned, newOption];

    setOptions(updatedOptions);
    setUserVotedOptionId(newId);
    broadcastPollOptionsSync(updatedOptions, newId);
    setIsRestaurantModalOpen(false);
    setSuggestName("");
    setSuggestPhone("");
    setSuggestAuthor("");
  };

  const handleAddHotelPizzaPreset = () => {
    const pizzaId = "hotel-pizza";
    const existing = options.find(o => o.id === pizzaId);
    const userTotal = userParty.players + userParty.parents;

    if (!existing) {
      const pizzaOption: MealOption = {
        id: pizzaId,
        name: "🍕 Pizzaville Oakville (Delivered to Lobby)",
        type: "Hotel Lobby Delivery",
        totalSeats: userTotal,
        playerCount: userParty.players,
        parentCount: userParty.parents,
        votes: 1,
        phone: "(905) 844-7777",
        address: tournament.hotel.address,
        isCustom: true,
        isDelivery: true,
        suggestedBy: "Quick Pivot"
      };

      const cleaned = options.map(opt => {
        if (opt.id === userVotedOptionId) {
          return {
            ...opt,
            votes: Math.max(0, opt.votes - 1),
            totalSeats: Math.max(0, opt.totalSeats - userTotal),
            playerCount: Math.max(0, opt.playerCount - userParty.players),
            parentCount: Math.max(0, opt.parentCount - userParty.parents)
          };
        }
        return opt;
      });
      const updatedOptions = [...cleaned, pizzaOption];

      setOptions(updatedOptions);
      setUserVotedOptionId(pizzaId);
      broadcastPollOptionsSync(updatedOptions, pizzaId);
    } else {
      handleVote(pizzaId);
    }
  };

  const updatePartyCounts = (playersDelta: number, parentsDelta: number) => {
    const nextPlayers = Math.max(1, userParty.players + playersDelta);
    const nextParents = Math.max(0, userParty.parents + parentsDelta);
    const diffPlayers = nextPlayers - userParty.players;
    const diffParents = nextParents - userParty.parents;
    const diffTotal = diffPlayers + diffParents;

    setUserParty({ players: nextPlayers, parents: nextParents });

    if (userVotedOptionId && !isPollLocked) {
      const updatedOptions = options.map(opt => {
        if (opt.id !== userVotedOptionId) return opt;
        return {
          ...opt,
          totalSeats: Math.max(0, opt.totalSeats + diffTotal),
          playerCount: Math.max(0, opt.playerCount + diffPlayers),
          parentCount: Math.max(0, opt.parentCount + diffParents)
        };
      });
      setOptions(updatedOptions);
      broadcastPollOptionsSync(updatedOptions);
    }
  };

  const upvoteAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, upvotes: a.upvotes + 1 } : a));
  };

  const handleAddTip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipTitle.trim() || !tipContent.trim() || !activeModalGameId) return;

    const newAlert: VenueAlert = {
      id: Date.now().toString(),
      gameId: activeModalGameId,
      type: tipCategory,
      title: tipTitle.trim(),
      content: tipContent.trim(),
      author: tipAuthor.trim() || "Team Parent",
      upvotes: 1
    };

    setAlerts(prev => [newAlert, ...prev]);
    setActiveModalGameId(null);
    setTipTitle("");
    setTipContent("");
    setTipAuthor("");
  };

  const totalPollVotes = options.reduce((sum, o) => sum + o.votes, 0);
  const totalVotesCast = totalPollVotes;
  const highestVotes = Math.max(...options.map(o => o.votes), 0);
  const winningOption = highestVotes > 0
    ? [...options].sort((a, b) => (b.votes - a.votes) || (b.totalSeats - a.totalSeats))[0]
    : undefined;
  const winningOptionPercent =
    winningOption && totalVotesCast > 0 ? Math.round((winningOption.votes / totalVotesCast) * 100) : 0;

  const isVoterOfWinner = winningOption && userVotedOptionId === winningOption.id;
  const isJoiningWinner = userFinalAttendance === "attending";
  const userPartyTotal = userParty.players + userParty.parents;

  const confirmedReservationSeats = winningOption 
    ? (winningOption.totalSeats || winningOption.votes * 2) + (!isVoterOfWinner && isJoiningWinner ? userPartyTotal : 0)
    : 0;
  
  const confirmedPlayers = winningOption 
    ? winningOption.playerCount + (!isVoterOfWinner && isJoiningWinner ? userParty.players : 0)
    : 0;

  const confirmedParents = winningOption 
    ? winningOption.parentCount + (!isVoterOfWinner && isJoiningWinner ? userParty.parents : 0)
    : 0;

  const estimatedPizzas = Math.ceil(confirmedReservationSeats / 2.5);

  const handleSetMealMode = async (nextMode: "lunch" | "dinner") => {
    setManualMealMode(nextMode);

    // 1. Sync to localStorage & BroadcastChannel immediately for instant cross-tab reactivity
    try {
      window.localStorage.setItem(`awayday_meal_mode_${slug}`, nextMode);
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel(`awayday_sync_${slug}`);
        bc.postMessage({ type: "MEAL_MODE_CHANGED", mealMode: nextMode, mealType: nextMode });
        bc.close();
      }
    } catch {
      // Ignore local storage errors
    }

    // 2. Broadcast over active Supabase Realtime channel (`trip_${slug}`) + persist to team_trips table
    try {
      const ch = realtimeChannelRef.current || supabase.channel(`trip_${slug}`);
      await ch.send({
        type: "broadcast",
        event: "meal_mode_sync",
        payload: { mealMode: nextMode, mealType: nextMode }
      });

      const { error } = await supabase
        .from("team_trips")
        .update({ active_meal_mode: nextMode })
        .eq("share_slug", slug);

      if (error) {
        console.error("Error updating active_meal_mode:", error);
      }
    } catch (err) {
      console.error("Failed to persist meal mode to Supabase:", err);
    }
  };

  const handleToggleMealMode = async () => {
    const nextMode = isLunch ? "dinner" : "lunch";
    await handleSetMealMode(nextMode);
  };

  // Compute Travel Corridor Plan based on departureOrigin and first scheduled game
  const firstGame = games[0];
  const firstEventArrivalMins = firstGame
    ? getArrivalCallMinutes(firstGame.tipOffMinutes, firstGame.warmupBufferMin || 30)
    : 915;
  const firstEventDayLabel = firstGame?.dayLabel || "Sat, Oct 24";
  const corridorPlan = computeTravelCorridor(
    departureOrigin,
    "Oakville, ON",
    tournament.hotel.name,
    firstEventArrivalMins,
    firstEventDayLabel
  );

  return (
    <div
      style={{ color: '#0f172a' }}
      className="stadium-canvas w-full pb-32"
    >
      {/* Sticky App Header */}
      <header className="sticky top-0 z-30 pt-[max(1rem,env(safe-area-inset-top))] bg-[#0e1626]/95 text-white border-b border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">AwayDay Run-Sheet</span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none shrink-0">
                  Manager Mode
                </span>
              )}
            </div>
            <h1 className="text-lg font-black leading-tight text-white truncate tracking-tight">{tournament.teamName}</h1>
          </div>

          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-2 border-l-2 border-l-emerald-400 bg-emerald-400/10 text-emerald-300 font-mono text-xs uppercase tracking-wider px-2.5 py-1 rounded-r cursor-default select-none pointer-events-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Live Sync
            </span>
          </div>
        </div>

        {/* Centered Freshness & Date Micro-bar */}
        <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-1.5 flex items-center justify-center gap-2 text-[11px] text-center">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
            <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{tournament.lastUpdatedText}</span>
          </div>
          <span className="text-slate-600 font-bold">•</span>
          <span className="text-[11px] text-amber-400 font-extrabold shrink-0">{tournament.dates}</span>
        </div>

        {/* Persistent Manager Utility Banner docked directly below trip header */}
        {isAdmin && (
          <div className="bg-[#0b111e] border-t border-amber-500/30 px-4 py-2">
            <div className="max-w-md mx-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                  MANAGER MODE
                </span>
                <span className="text-[11px] text-slate-300 font-mono hidden sm:inline">Live Controls</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setParsedPreviewGames(null);
                    setIsIngestModalOpen(true);
                  }}
                  className="bg-[#111827] hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-semibold font-mono px-3 py-1 rounded-lg transition-all cursor-pointer active:scale-[0.96]"
                >
                  <span className="sm:hidden">+ Run Sheet</span>
                  <span className="hidden sm:inline">+ Update Run Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={handleExitAdmin}
                  title="Exit Admin Mode"
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer active:scale-[0.96]"
                >
                  <Lock className="w-3 h-3 text-amber-400" /> Exit Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-md mx-auto px-4 pt-3.5 space-y-4">
        
        {activeTab === "schedule" && (
          <div key="schedule" className="space-y-4 animate-in fade-in-50 duration-200 ease-out">
        {/* Executive Trip Anchor Banner */}
        <section className="bg-[#111827] text-white rounded-2xl p-5 border border-slate-800/90 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 pr-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                  <MapPin className="w-3 h-3 text-amber-400" /> {tournament.dates}
                </span>
                <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                  <Shield className="w-2.5 h-2.5 text-slate-300" /> {tournament.division}
                </span>
              </div>

              <h2 className="text-lg font-black text-white tracking-tight pt-0.5">
                {tournament.name}
              </h2>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium pt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Venues: <strong className="text-white font-black">{tournament.primaryHub}</strong></span>
              </div>
            </div>

            <a 
              href={getMapsUrl(tournament.primaryHubAddress)} 
              target="_blank" 
              rel="noreferrer"
              className="shrink-0 text-xs flex items-center gap-1.5 font-extrabold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3 py-2 rounded-xl active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-400" /> Hub
            </a>
          </div>
        </section>

        {/* Hero: Next Tip-Off (Auto-Advance & Live Clock Evaluation) */}
        {(() => {
          const nextGame = games.find((g) => !isGameElapsedByClock(g, nowMs));
          if (!nextGame) {
            return (
              <section className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#182235] to-[#111827] border border-emerald-500/40 text-white shadow-2xl">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
                <div className="relative flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 border-l-2 border-l-emerald-400 bg-emerald-400/10 text-emerald-300 font-mono text-xs uppercase tracking-wider px-2.5 py-1 rounded-r cursor-default select-none pointer-events-none">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Session Wrap
                  </span>
                  <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                    {games.length} / {games.length} Final
                  </span>
                </div>
                <h2 className="relative mt-3 text-2xl font-black tracking-tight text-white">
                  Tournament Schedule Complete
                </h2>
                <p className="relative mt-1 text-xs text-slate-300 font-medium">
                  All {games.length} scheduled matchups for {tournament.name} have concluded. Safe travels home!
                </p>
                {isAdmin && (
                  <div className="relative mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleResetGamesStatus}
                      className="text-[11px] font-mono font-bold text-amber-300 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-[0.96]"
                    >
                      Reset Schedule Status
                    </button>
                  </div>
                )}
              </section>
            );
          }
          const bufferMins = nextGame.warmupBufferMin || 30;
          const nextArrival = getArrivalCallMinutes(nextGame.tipOffMinutes, bufferMins);
          const nextDepart = nextArrival - nextGame.hotelTravelMin;
          return (
            <section className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#182235] to-[#111827] border border-amber-500/40 text-white shadow-2xl">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/15 blur-3xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                    Next Tip-Off {nextGame.dayLabel ? `• ${nextGame.dayLabel}` : ""}
                  </span>
                  {nextGame.telemetryFlag && (
                    <span className="inline-flex items-center gap-1 border-l-2 border-l-emerald-400 bg-emerald-400/10 text-emerald-300 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                      {nextGame.telemetryFlag}
                    </span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none shrink-0">
                  {nextGame.court}
                </span>
              </div>
              <div className="relative mt-3 tabular-nums font-mono text-6xl font-black tracking-tighter leading-none text-amber-400">
                {formatTime(nextGame.tipOffMinutes)}
              </div>
              <h2 className="relative mt-2 text-xl font-black tracking-tight truncate text-white">
                {nextGame.matchup || `vs. ${nextGame.opponent}`}
              </h2>
              <div className="relative mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-[11px] px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                  Arrive by {formatTime(nextArrival)} ({bufferMins}m before tip)
                </span>
              </div>
              <div className="relative mt-4 flex items-center justify-between gap-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Leave hotel <span className="font-mono text-sm font-black tabular-nums text-white">{formatTime(nextDepart)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleMarkFinalAndAdvance(nextGame.id)}
                      className="shrink-0 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 px-2.5 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 active:scale-[0.96] transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Mark Final & Advance
                    </button>
                  )}
                  <a
                    href={getMapsUrl(`${nextGame.venueName} ${nextGame.venueAddress} ${nextGame.city}`)}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-lg shadow-black/40"
                  >
                    <Navigation className="w-3.5 h-3.5 text-slate-950" /> Navigate
                  </a>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Weekend Run-Sheet */}
        <section id="section-games" className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-[#111827] border border-slate-800 text-amber-400 shadow-2xs">
                <CalendarDays className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Weekend Run-Sheet</h3>
            </div>
            <span className="text-slate-600 font-mono text-xs uppercase tracking-wider">{games.length} Games Scheduled</span>
          </div>

          {games.map((game, index) => {
            const bufferMins = game.warmupBufferMin || 30;
            const arrivalMinutes = getArrivalCallMinutes(game.tipOffMinutes, bufferMins);
            const departMinutes = arrivalMinutes - game.hotelTravelMin;
            const gameAlerts = alerts.filter(a => a.gameId === game.id);
            const showDayHeader = index === 0 || game.dayLabel !== games[index - 1]?.dayLabel;

            return (
              <React.Fragment key={game.id}>
                {showDayHeader && game.dayLabel && (
                  <div className="flex items-center justify-between px-1 pt-2">
                    <span className="inline-flex items-center gap-1.5 border-l-2 border-l-amber-500 bg-[#111827] text-amber-300 font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-r shadow-xs">
                      <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                      {game.dayLabel === "Sat, Oct 24" ? "Saturday, Oct 24" : game.dayLabel === "Sun, Oct 25" ? "Sunday, Oct 25" : game.dayLabel}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-600 truncate">
                      {game.venueName} ({game.venueAddress})
                    </span>
                  </div>
                )}
              <div className="bg-[#111827] border border-slate-800/90 shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-5 pb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                        Game {index + 1}{game.dayLabel ? ` • ${game.dayLabel}` : ""}
                      </span>
                      {game.telemetryFlag && (
                        <span className="inline-flex items-center border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                          {game.telemetryFlag}
                        </span>
                      )}
                      {game.status && (
                        <span className={`inline-flex items-center border-l-2 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none ${
                          game.status === "Live"
                            ? "border-l-emerald-400 bg-emerald-400/10 text-emerald-300"
                            : game.status === "Delayed"
                            ? "border-l-amber-400 bg-amber-400/10 text-amber-300"
                            : "border-l-slate-400 bg-slate-800 text-slate-300"
                        }`}>
                          {game.status}
                        </span>
                      )}
                      {game.jerseyColor && (
                        <span className="inline-flex items-center border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                          Jersey: {game.jerseyColor}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
                      {game.matchup || `vs. ${game.opponent}`}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-[11px] px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                        Arrive by {formatTime(arrivalMinutes)} ({bufferMins}m before tip)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                      {game.court}
                    </span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => openEditDrawer(game)}
                        title="Quick-Edit Game"
                        aria-label={`Edit Game ${index + 1}`}
                        className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-colors cursor-pointer active:scale-95"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Perforated ticket divider */}
                <div className="relative h-px mx-5 border-t border-dashed border-slate-700/80">
                  <span className="absolute -left-8 -top-2.5 h-5 w-5 rounded-full bg-[#f6f4ee]" />
                  <span className="absolute -right-8 -top-2.5 h-5 w-5 rounded-full bg-[#f6f4ee]" />
                </div>

                <div className="p-5 pt-4 space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-2 py-3 text-center">
                      <span className="block tabular-nums font-mono text-xl font-black text-white">{formatTime(departMinutes)}</span>
                      <span className="block mt-1 text-slate-400 font-mono text-[10px] uppercase tracking-wider">Depart</span>
                      <span className="block text-[10px] text-slate-400 font-medium">{game.hotelTravelMin}m drive</span>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-2 py-3 text-center">
                      <span className="block tabular-nums font-mono text-xl font-black text-white">{formatTime(arrivalMinutes)}</span>
                      <span className="block mt-1 text-slate-400 font-mono text-[10px] uppercase tracking-wider">Gym Arrival</span>
                      <span className="block text-[10px] text-slate-400 font-medium">{bufferMins}m before tip</span>
                    </div>
                    <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl px-2 py-3 text-center">
                      <span className="block tabular-nums font-mono text-xl font-black text-amber-300">{formatTime(game.tipOffMinutes)}</span>
                      <span className="block mt-1 text-amber-300/90 font-mono text-[10px] uppercase tracking-wider">Tip-Off</span>
                      <span className="block text-[10px] text-amber-300/75 font-medium">game time</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-black text-white text-xs truncate">{game.venueName}</span>
                      </div>
                      <span className="text-slate-300 text-[11px] font-medium truncate block ml-4">
                        {game.venueAddress}, {game.city}
                      </span>
                    </div>
                    <a 
                      href={getMapsUrl(`${game.venueName} ${game.venueAddress} ${game.city}`)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="shrink-0 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                    >
                      <Navigation className="w-3 h-3 text-amber-400" /> Directions
                    </a>
                  </div>

                  <div className="border-t border-slate-800 pt-3">
                    <button
                      type="button"
                      onClick={() => setOpenTipsGameId(openTipsGameId === game.id ? null : game.id)}
                      aria-expanded={openTipsGameId === game.id}
                      className="w-full flex items-center justify-between gap-2 active:scale-[0.98] transition-transform duration-100 ease-out cursor-pointer"
                    >
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Hub Tips ({gameAlerts.length})
                        <span className="inline-flex items-center border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                          {gameAlerts.length}
                        </span>
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openTipsGameId === game.id ? "rotate-180" : ""}`} />
                    </button>

                    {openTipsGameId === game.id && (
                      <div className="mt-3 space-y-2.5 animate-in fade-in-50 slide-in-from-top-1 duration-200 ease-out">
                        {gameAlerts.length === 0 ? (
                          <p className="text-[11px] text-slate-400 font-medium italic">No facility warnings posted yet for this gym.</p>
                        ) : (
                          <div className="space-y-2">
                            {gameAlerts.map(alert => (
                              <div key={alert.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2 shadow-2xs">
                                <div>
                                  <h4 className="text-xs font-black text-white">{alert.title}</h4>
                                  <p className="text-xs text-slate-300 font-medium leading-snug mt-0.5">{alert.content}</p>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-800 pt-1.5 text-[11px] text-slate-400 font-mono">
                                  <span>By {alert.author}</span>
                                  <button
                                    onClick={() => upvoteAlert(alert.id)}
                                    className="flex items-center gap-1.5 font-sans font-bold text-[11px] bg-slate-800 border border-slate-700 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded-lg active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-2xs"
                                  >
                                    <ThumbsUp className="w-3 h-3 text-amber-400" /> Helpful ({alert.upvotes})
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => setActiveModalGameId(game.id)}
                          className="w-full flex items-center justify-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-2 rounded-xl border border-amber-400/30 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Tip
                        </button>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="border-t border-slate-800 bg-slate-900/80 -mx-5 -mb-5 p-3.5 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-black text-amber-300">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                        <span className="uppercase tracking-wider">Manager Quick-Shift:</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => shiftGameTime(game.id, -30)} 
                          className="bg-slate-800 border border-slate-700 hover:bg-slate-700 active:scale-[0.96] px-2.5 py-1.5 rounded-lg text-slate-200 font-extrabold shadow-2xs transition-transform duration-100 ease-out cursor-pointer"
                        >
                          -30m
                        </button>
                        <button 
                          onClick={() => shiftGameTime(game.id, -15)} 
                          className="bg-slate-800 border border-slate-700 hover:bg-slate-700 active:scale-[0.96] px-2.5 py-1.5 rounded-lg text-slate-200 font-extrabold shadow-2xs transition-transform duration-100 ease-out cursor-pointer"
                        >
                          -15m
                        </button>
                        <button 
                          onClick={() => shiftGameTime(game.id, 15)} 
                          className="bg-amber-400/20 border border-amber-400/40 hover:bg-amber-400/30 active:scale-[0.96] px-2.5 py-1.5 rounded-lg text-amber-300 font-extrabold shadow-2xs transition-transform duration-100 ease-out cursor-pointer"
                        >
                          +15m
                        </button>
                        <button 
                          onClick={() => shiftGameTime(game.id, 30)} 
                          className="bg-amber-400/20 border border-amber-400/40 hover:bg-amber-400/30 active:scale-[0.96] px-2.5 py-1.5 rounded-lg text-amber-300 font-extrabold shadow-2xs transition-transform duration-100 ease-out cursor-pointer"
                        >
                          +30m
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {game.downtimeAfter && (
                <div className="bg-[#111827]/95 border border-amber-500/30 rounded-2xl p-4 shadow-xl flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                        <Timer className="w-3 h-3 text-amber-400" /> {game.downtimeAfter.duration}
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-white">
                        {game.downtimeAfter.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium leading-snug">
                      {game.downtimeAfter.note}
                    </p>
                  </div>
                </div>
              )}
              </React.Fragment>
            );
          })}
        </section>

          </div>
        )}

        {activeTab === "fuel" && (
          <div key="fuel" className="space-y-4 animate-in fade-in-50 duration-200 ease-out">
        {/* =========================================================
            ANY-CITY TRAVEL CORRIDOR & HIGHWAY PIT STOPS ENGINE
        ========================================================= */}
        <section id="section-corridor" className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-[#111827] border border-slate-800 text-amber-400 shadow-2xs">
                <Car className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Travel Corridor & Highway Pit Stops
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-[#111827] text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-r shadow-2xs">
              {corridorPlan.stops.length} {corridorPlan.stops.length === 1 ? "Stop" : "Stops"} Mapped
            </span>
          </div>

          <div className="bg-[#111827] text-white rounded-2xl p-5 shadow-2xl border border-slate-800/90 space-y-4">
            {/* Route Header & Origin Quick Selector Popover */}
            <div className="relative">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                    {corridorPlan.highwayRouteSummary}
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white tracking-tight mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span>{corridorPlan.origin}</span>
                    <span className="text-amber-400 font-mono">➔</span>
                    <span>{corridorPlan.destination}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Target Base Camp: <span className="text-slate-200 font-bold">{corridorPlan.destinationVenue}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOriginPopoverOpen((prev) => !prev);
                    setIsCustomOriginMode(false);
                  }}
                  aria-expanded={isOriginPopoverOpen}
                  className="shrink-0 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1 active:scale-[0.96] transition-all cursor-pointer shadow-xs"
                >
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>Origin</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOriginPopoverOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Quick Origin Selector Popover */}
              {isOriginPopoverOpen && (
                <div className="mt-3 bg-slate-900/95 border border-slate-700 rounded-xl p-3 space-y-2.5 shadow-xl animate-in fade-in-50 slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Select Departure Origin Preset
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOriginPopoverOpen(false);
                        setIsCustomOriginMode(false);
                      }}
                      className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {CORRIDOR_ORIGIN_PRESETS.map((preset) => {
                      const isSelected =
                        preset === "Custom..."
                          ? isCustomOriginMode
                          : !isCustomOriginMode && departureOrigin.toLowerCase() === preset.toLowerCase();
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleSelectOriginPreset(preset)}
                          className={`py-2 px-2.5 rounded-lg text-left text-[11px] font-mono font-bold border transition-all cursor-pointer active:scale-[0.97] truncate ${
                            isSelected
                              ? "bg-amber-400 text-slate-950 border-amber-400 shadow-xs"
                              : "bg-slate-950/90 text-slate-200 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>

                  {isCustomOriginMode && (
                    <form onSubmit={handleApplyCustomOrigin} className="pt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={customOriginDraft}
                        onChange={(e) => setCustomOriginDraft(e.target.value)}
                        placeholder="Enter city (e.g. Kingston, ON or Barrie, ON)"
                        autoFocus
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                      >
                        Set Route
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Telemetry Summary: Drive Duration & Recommended Departure Call */}
            <div className="grid grid-cols-2 gap-2.5 border-t border-slate-800 pt-3.5">
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Est. Drive Time & Distance
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-lg font-mono font-black text-white tabular-nums">
                    {corridorPlan.durationLabel}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    ({corridorPlan.distanceKm} km)
                  </span>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/90 block">
                  Recommended Departure Call
                </span>
                <span className="mt-1 text-sm sm:text-base font-mono font-black text-amber-300 block tabular-nums">
                  {corridorPlan.recommendedDepartureLabel}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 font-mono bg-slate-900/60 border border-slate-800/80 rounded-lg px-3 py-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{corridorPlan.departureContextNote}</span>
            </div>

            {/* Strategic Highway Pit-Stop Waypoint Cards */}
            <div className="space-y-2.5 pt-0.5">
              {corridorPlan.stops.map((stop, idx) => (
                <div
                  key={stop.id}
                  className="bg-slate-900/75 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 space-y-2.5 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                          Stop #{idx + 1} • {stop.milestoneTag}
                        </span>
                        <span className="inline-flex items-center border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                          {stop.elapsedDriveLabel}
                        </span>
                      </div>
                      <h5 className="text-sm font-black text-white mt-1.5 leading-snug">
                        {stop.title}
                      </h5>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-snug">
                    <span className="text-amber-300 font-mono text-[11px] uppercase tracking-wider font-bold mr-1">
                      Athlete Fuel & Coffee:
                    </span>
                    {stop.fuelAndCoffeeOptions}
                  </p>

                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                      Open in Maps:
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={stop.appleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 active:scale-[0.96] transition-transform cursor-pointer"
                      >
                        <Navigation className="w-3 h-3 text-amber-400" /> Apple Maps
                      </a>
                      <a
                        href={stop.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-[0.96] transition-transform cursor-pointer shadow-xs"
                      >
                        <MapPin className="w-3 h-3 text-slate-950" /> Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            MEAL INFO SECTION (Dynamically Computed Timestamps)
        ========================================================= */}
        <section id="section-meals" className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-[#111827] border border-slate-800 text-amber-400 shadow-2xs">
                <Utensils className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                {isLunch ? "Midday Fuel (Grab & Go)" : "Team Dinner & Reservation"}
              </h3>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-1 bg-[#111827] border border-slate-800 p-0.5 rounded-xl text-[10px]">
                <button
                  type="button"
                  onClick={handleToggleMealMode}
                  className="px-2.5 py-1 rounded-lg font-black uppercase tracking-wider text-slate-950 hover:bg-amber-300 bg-amber-400 shadow-2xs border border-amber-500/30 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                >
                  Admin Toggle: {isLunch ? "🌙 Show Dinner" : "🥪 Show Lunch"}
                </button>
              </div>
            )}
          </div>

          {/* Downtime Window Card with Corrected Timestamps */}
          <div className="bg-[#111827] text-white rounded-2xl p-4.5 shadow-2xl border border-slate-800/90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                {isLunch ? <Salad className="w-4 h-4 text-amber-400" /> : <Utensils className="w-4 h-4 text-amber-400" />}
                {isLunch ? "Lunch Downtime Window" : "Dinner Downtime Window"}
              </span>
              <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                {windowHours}h {windowRemainingMins}m Window
              </span>
            </div>
            
            <div className="mt-3.5 flex items-baseline justify-between border-t border-slate-800 pt-3">
              <div>
                <p className="text-slate-400 font-mono text-xs uppercase tracking-wider">Available Downtime:</p>
                <p className="text-base font-black text-white tracking-tight mt-0.5 tabular-nums">
                  {formatTime(activeWindowStart)} – {formatTime(activeWindowEnd)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                  {isLunch ? "Game 2 Arrival" : "Evening Wind-Down"}
                </p>
                <p className="text-xs font-black text-amber-400 mt-0.5">
                  {isLunch 
                    ? `Be at gym by ${formatTime(activeWindowEnd)}`
                    : `Back at hotel by ${formatTime(activeWindowEnd)}`}
                </p>
              </div>
            </div>
          </div>

          {/* LUNCH: GRAB & GO */}
          {isLunch ? (
            <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5 shadow-2xl transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-bottom-2 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> Fast Athlete Fuel Near Gym
                  </h4>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    No reservations needed — quick wraps, smoothies, & light carbs
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none shrink-0">
                  Quick Turnaround
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {quickLunchSpots.map((spot, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-xs flex items-center justify-between gap-2 shadow-2xs transition-colors">
                    <div className="pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-white">{spot.name}</span>
                        <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                          {spot.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-300 block mt-0.5 font-medium">
                        {spot.distance} • <span className="text-slate-400">{spot.note}</span>
                      </span>
                    </div>

                    <a 
                      href={getMapsUrl(spot.name + " " + spot.address)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="shrink-0 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-2xs"
                    >
                      <Navigation className="w-3.5 h-3.5 text-amber-400" /> Map
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* DINNER: FORMAL CONSENSUS & RESERVATION POLL */
            <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5 shadow-2xl transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-bottom-2 space-y-4">
              {/* Manager "Poll Time-Travel" Dev Toggle */}
              {isAdmin && (
                <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-2 space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                      Manager Poll Time-Travel
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      State: {isPollLocked ? "Locked" : isPollLockSoon ? "Lock Soon" : "Open"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    {([
                      { id: "live", label: "Live Clock" },
                      { id: "open", label: "Force Open" },
                      { id: "lock_soon", label: "Force Lock Soon" },
                      { id: "locked", label: "Force Locked" },
                    ] as const).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPollTestMode(mode.id)}
                        className={`py-1.5 px-1.5 rounded-md font-mono text-[10px] font-bold transition-all cursor-pointer truncate ${
                          pollTestMode === mode.id
                            ? "bg-amber-400 text-slate-950 shadow-2xs"
                            : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  {isPollLocked ? <Lock className="w-3.5 h-3.5 text-emerald-400" /> : <Timer className="w-3.5 h-3.5 text-amber-400" />}
                  {isPollLocked ? "Confirmed Team Dinner Reservation" : "Team Dinner Reservation Poll"}
                </span>
                <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none shrink-0 tabular-nums">
                  {totalVotesCast} total family votes cast
                </span>
              </div>

              {winningOption && (
                <div className="bg-slate-950 text-white rounded-xl p-4 shadow-sm border border-slate-800 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-r">
                      🏆 CURRENT LEADER: {winningOption.name}
                    </span>
                    {isPollLocked && (
                      <span className="inline-flex items-center gap-1 border-l-2 border-l-emerald-400 bg-emerald-400/15 text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-r">
                        🎉 TEAM RESERVATION LOCKED
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1.5 border-t border-slate-800/80">
                    <span className="text-xs font-mono font-bold text-emerald-300 tabular-nums">
                      Reservation Target: {winningOption.totalSeats || winningOption.votes * 2} Seats ({winningOptionPercent}%)
                    </span>
                    <span className="text-[11px] font-medium text-slate-300 tabular-nums">
                      {confirmedPlayers} Players • {confirmedParents} Parents
                    </span>
                  </div>

                  {winningOption.isDelivery && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded-lg p-2.5 flex items-center justify-between font-medium">
                      <span>Target Order: <strong className="text-white font-black">~{estimatedPizzas} Large Pizzas</strong></span>
                      <span className="text-[10px] text-slate-400 font-mono">1 pie per 2.5 people</span>
                    </div>
                  )}

                  {isPollLocked && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> {winningOption.phone}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${winningOption.phone.replace(/[^0-9]/g, "")}`}
                          className="text-[11px] font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-xl flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-xs"
                        >
                          <PhoneCall className="w-3 h-3 text-slate-950" /> Call Restaurant
                        </a>
                        <a
                          href={getMapsUrl(`${winningOption.name} ${winningOption.address}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-extrabold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-xs"
                        >
                          <Navigation className="w-3 h-3 text-amber-400" /> Open in Maps
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isPollLocked && winningOption && !isVoterOfWinner && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5 animate-in fade-in duration-200">
                  <div>
                    <span className="text-xs font-black text-white block">
                      {winningOption.name} won the vote!
                    </span>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-snug">
                      You previously picked {options.find(o => o.id === userVotedOptionId)?.name || "another spot"}. Are you joining the team table?
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      onClick={() => setUserFinalAttendance("attending")}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer ${
                        userFinalAttendance === "attending"
                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300"
                          : "bg-slate-900 border border-amber-400/30 text-amber-300 hover:bg-slate-800"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Count Us In ({userPartyTotal} seats)
                    </button>

                    <button
                      onClick={() => setUserFinalAttendance("declined")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer ${
                        userFinalAttendance === "declined"
                          ? "bg-slate-800 text-white"
                          : "bg-transparent text-amber-300/80 hover:bg-amber-950/40"
                      }`}
                    >
                      Splitting Off
                    </button>
                  </div>
                </div>
              )}

              {isPollLocked && winningOption && isVoterOfWinner && (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-200 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold">You are included in the headcount ({userPartyTotal} seats)</span>
                  </div>
                  <span className="inline-flex items-center gap-1 border-l-2 border-l-emerald-400 bg-emerald-400/10 text-emerald-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                    Confirmed
                  </span>
                </div>
              )}

              {!isPollLocked && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Your Family Count:
                    </span>
                    <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                      {userPartyTotal} Seat{userPartyTotal > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 shadow-2xs">
                      <span className="text-slate-300 font-bold text-[11px] uppercase">Players:</span>
                      <div className="flex items-center gap-2 font-black">
                        <button 
                          onClick={() => updatePartyCounts(-1, 0)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-800 hover:bg-slate-700 active:scale-[0.96] text-white transition-transform duration-100 ease-out cursor-pointer"
                        >-</button>
                        <span className="w-4 text-center tabular-nums text-sm font-black text-white">{userParty.players}</span>
                        <button 
                          onClick={() => updatePartyCounts(1, 0)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-800 hover:bg-slate-700 active:scale-[0.96] text-white transition-transform duration-100 ease-out cursor-pointer"
                        >+</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 shadow-2xs">
                      <span className="text-slate-300 font-bold text-[11px] uppercase">Parents:</span>
                      <div className="flex items-center gap-2 font-black">
                        <button 
                          onClick={() => updatePartyCounts(0, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-800 hover:bg-slate-700 active:scale-[0.96] text-white transition-transform duration-100 ease-out cursor-pointer"
                        >-</button>
                        <span className="w-4 text-center tabular-nums text-sm font-black text-white">{userParty.parents}</span>
                        <button 
                          onClick={() => updatePartyCounts(0, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-800 hover:bg-slate-700 active:scale-[0.96] text-white transition-transform duration-100 ease-out cursor-pointer"
                        >+</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isPollLocked && (
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsRestaurantModalOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-white text-slate-950 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-lg shadow-black/40"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[3]" /> Suggest a Spot
                  </button>

                  <button
                    type="button"
                    onClick={handleAddHotelPizzaPreset}
                    className="py-2.5 px-3 rounded-xl border border-amber-500/40 bg-amber-400/10 hover:bg-amber-400/20 text-[11px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-2xs"
                  >
                    <Pizza className="w-3.5 h-3.5 text-amber-400" /> Lobby Pizza Pivot
                  </button>
                </div>
              )}

              {!isPollLocked && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-black text-white block leading-tight">
                        Vote closes at {formatTime(voteClosingMinutes)}
                      </span>
                      <span className="text-[11px] font-medium text-slate-300 block leading-tight mt-0.5">
                        Manager will finalize reservation before tip-off
                      </span>
                    </div>
                  </div>
                  {isPollLockSoon ? (
                    <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none shrink-0">
                      Locks Soon
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 border-l-2 border-l-emerald-400 bg-emerald-400/10 text-emerald-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none shrink-0">
                      Poll Open
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2.5 pt-0.5">
                {options.map(option => {
                  const isWinner = winningOption?.id === option.id;
                  const isUserPick = userVotedOptionId === option.id;
                  const votePercent = totalPollVotes > 0 ? Math.round((option.votes / totalPollVotes) * 100) : 0;
                  const optionSeats = option.totalSeats || option.votes * 2;

                  if (isPollLocked && isWinner) {
                    return (
                      <div
                        key={option.id}
                        className="w-full p-4 rounded-xl border-2 border-emerald-500 bg-emerald-950/35 ring-2 ring-emerald-500/40 text-left text-xs shadow-lg space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="pr-2 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="inline-flex items-center gap-1 border-l-2 border-l-emerald-400 bg-emerald-400/15 text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-r">
                                🎉 TEAM RESERVATION LOCKED
                              </span>
                              {isUserPick && (
                                <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/20 text-amber-200 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-r">
                                  Your Vote
                                </span>
                              )}
                            </div>
                            <span className="text-base font-black block text-white">
                              {option.name}
                            </span>
                            <span className="text-[11px] text-slate-300 block mt-0.5 font-medium">
                              {option.type} • <span className="font-bold text-white">{option.playerCount}p + {option.parentCount} adults</span>
                            </span>
                          </div>

                          <div className="shrink-0 text-right pl-2">
                            <span className="font-black px-3 py-1 rounded-lg text-xs block tabular-nums shadow-2xs bg-emerald-500 text-slate-950">
                              {option.votes} votes ({optionSeats} seats)
                            </span>
                            <span className="text-[10px] font-mono text-emerald-300 block mt-1 uppercase tracking-wider tabular-nums font-bold">
                              {votePercent}% of vote
                            </span>
                          </div>
                        </div>

                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                            style={{ width: `${votePercent}%` }}
                          />
                        </div>

                        <div className="pt-1 flex items-center justify-end gap-2 border-t border-emerald-500/20">
                          <a
                            href={`tel:${option.phone.replace(/[^0-9]/g, "")}`}
                            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-[0.96] transition-transform cursor-pointer shadow-xs"
                          >
                            <PhoneCall className="w-3 h-3 text-slate-950" /> Call Restaurant
                          </a>
                          <a
                            href={getMapsUrl(`${option.name} ${option.address}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-extrabold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-[0.96] transition-transform cursor-pointer shadow-xs"
                          >
                            <Navigation className="w-3 h-3 text-amber-400" /> Open in Maps
                          </a>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={isPollLocked}
                      onClick={() => handleVote(option.id)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all duration-150 ease-out relative shadow-2xs ${
                        isPollLocked
                          ? "bg-slate-900/40 border-slate-800 opacity-40 grayscale pointer-events-none cursor-default"
                          : isUserPick
                            ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/40 shadow-md cursor-pointer active:scale-[0.96]"
                            : isWinner
                              ? "bg-slate-900 border-amber-400/50 ring-1 ring-amber-400/20 shadow-md cursor-pointer active:scale-[0.96]"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700 cursor-pointer active:scale-[0.96]"
                      }`}
                    >
                      <div className="pr-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-black block text-white">
                            {option.name}
                          </span>
                          {isWinner && !isPollLocked && (
                            <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                              <Trophy className="w-2.5 h-2.5" /> Leading
                            </span>
                          )}
                          {isUserPick && (
                            <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/20 text-amber-200 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                              Your Vote
                            </span>
                          )}
                          {option.isCustom && !isWinner && (
                            <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                              <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Parent Pick
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-300 block mt-0.5 font-medium">
                          {option.type} • <span className="font-bold text-white">{option.playerCount}p + {option.parentCount} adults</span>
                        </span>
                        <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isWinner ? "bg-emerald-400" : isUserPick ? "bg-amber-400" : "bg-slate-500"
                            }`}
                            style={{ width: `${votePercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="shrink-0 text-right pl-2">
                        {isPollLocked ? (
                          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-lg font-mono text-xs font-bold">
                            🔒 Closed
                          </span>
                        ) : (
                          <span className={`font-black px-3 py-1 rounded-lg text-xs block tabular-nums shadow-2xs ${
                            isWinner 
                              ? "bg-emerald-500 text-slate-950" 
                              : isUserPick
                                ? "bg-amber-400 text-slate-950"
                                : "bg-slate-800 text-slate-200 border border-slate-700"
                          }`}>
                            {option.votes} votes ({optionSeats} seats)
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-300 block mt-1 uppercase tracking-wider tabular-nums">
                          {isPollLocked ? `${option.votes} votes (${optionSeats} seats)` : `${votePercent}% of vote`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Sideline Fuel / Coffee Radar */}
        <section id="section-coffee" className="bg-[#111827] rounded-2xl p-5 shadow-2xl border border-slate-800/90 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-400/10 text-amber-400">
                <Coffee className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Sideline Fuel
                </h3>
                <span className="text-[11px] text-slate-300 font-medium">Coffee Radar & Parent Pit Stops</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
              Nearby Gym
            </span>
          </div>

          <div className="space-y-2.5">
            {coffeeSpots.map((spot, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-xs shadow-2xs transition-colors">
                <div className="pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-white">{spot.name}</span>
                    <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                      {spot.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 block mt-0.5 font-medium">
                    {spot.distance} • <span className="text-slate-400">{spot.note}</span>
                  </span>
                </div>
                <a 
                  href={getMapsUrl(spot.name + " " + spot.address)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="shrink-0 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-2xs"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-400" /> Map
                </a>
              </div>
            ))}
          </div>
        </section>

          </div>
        )}

        {activeTab === "hotel" && (() => {
          const hotelAlerts = alerts.filter(a => a.gameId === "hotel");
          return (
          <div key="hotel" className="space-y-4 animate-in fade-in-50 duration-200 ease-out">
        {/* Hotel Base Camp */}
        <section id="section-hotel" className="bg-[#111827] rounded-2xl p-5 shadow-2xl border border-slate-800/90 space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                <Hotel className="w-3 h-3 text-slate-300" /> Team Hotel Base Camp
              </span>
              <h2 className="text-lg font-black text-white flex items-center gap-1.5 mt-2 tracking-tight">
                {tournament.hotel.name}
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-0.5">{tournament.hotel.address}</p>
            </div>
            <a 
              href={getMapsUrl(tournament.hotel.address)} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs flex items-center gap-1.5 text-white font-extrabold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 rounded-xl active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-xs shrink-0"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-400" /> Map
            </a>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-amber-300 font-mono text-[10px] uppercase tracking-wider">Team Room Block Rate</span>
            <span className="font-black text-amber-300 text-xs font-mono">{tournament.hotel.rate}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800 pt-3">
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-mono block text-[10px] uppercase tracking-wider">Breakfast</span>
              <span className="font-black text-white text-sm mt-0.5 block">{tournament.hotel.breakfastHours}</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-mono block text-[10px] uppercase tracking-wider">Checkout</span>
              <span className="font-black text-white text-sm mt-0.5 block">{tournament.hotel.checkoutTime}</span>
            </div>
          </div>

          {/* Hub Tips Collapsible Accordion */}
          <div className="border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setOpenTipsGameId(openTipsGameId === "hotel" ? null : "hotel")}
              aria-expanded={openTipsGameId === "hotel"}
              className="w-full flex items-center justify-between gap-2 active:scale-[0.98] transition-transform duration-100 ease-out cursor-pointer"
            >
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Hub Tips ({hotelAlerts.length})
                <span className="inline-flex items-center border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                  {hotelAlerts.length}
                </span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openTipsGameId === "hotel" ? "rotate-180" : ""}`} />
            </button>

            {openTipsGameId === "hotel" && (
              <div className="mt-3 space-y-2.5 animate-in fade-in-50 slide-in-from-top-1 duration-200 ease-out">
                {hotelAlerts.length === 0 ? (
                  <p className="text-[11px] text-slate-400 font-medium italic">No hotel tips posted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {hotelAlerts.map(alert => (
                      <div key={alert.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2 shadow-2xs">
                        <div>
                          <h4 className="text-xs font-black text-white">{alert.title}</h4>
                          <p className="text-xs text-slate-300 font-medium leading-snug mt-0.5">{alert.content}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-800 pt-1.5 text-[11px] text-slate-400 font-mono">
                          <span>By {alert.author}</span>
                          <button
                            onClick={() => upvoteAlert(alert.id)}
                            className="flex items-center gap-1.5 font-sans font-bold text-[11px] bg-slate-800 border border-slate-700 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded-lg active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-2xs"
                          >
                            <ThumbsUp className="w-3 h-3 text-amber-400" /> Helpful ({alert.upvotes})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setActiveModalGameId("hotel")}
                  className="w-full flex items-center justify-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-2 rounded-xl border border-amber-400/30 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Tip
                </button>
              </div>
            )}
          </div>
        </section>

          </div>
          );
        })()}
      </main>

      {/* Floating app dock: switches screens, never scrolls to anchors */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pointer-events-none">
        <nav className="pointer-events-auto mx-auto w-full max-w-md grid grid-cols-3 gap-1 bg-[#0e1626]/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-1.5 shadow-2xl">
          {([
            { id: "schedule", label: "Schedule", Icon: CalendarDays },
            { id: "fuel", label: "Fuel", Icon: Utensils },
            { id: "hotel", label: "Hotel", Icon: Hotel },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? "page" : undefined}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] uppercase tracking-wider active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer ${
                activeTab === id
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Suggest a Restaurant Modal */}
      {isRestaurantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#111827] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-slate-800/90">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Suggest a Spot</h3>
                <p className="text-xs text-slate-300 font-medium">Know a great place for the team table?</p>
              </div>
              <button 
                onClick={() => setIsRestaurantModalOpen(false)}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomRestaurant} className="space-y-3.5">
              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1">Restaurant Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. The Cheshire Cat Pub, East Side Mario's" 
                  value={suggestName}
                  onChange={e => setSuggestName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1.5">Vibe / Why this spot?</label>
                <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                  {[
                    "Casual / Team Seating",
                    "Takes Large Groups",
                    "Fast / Healthy",
                    "Near Hotel"
                  ].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSuggestType(cat)}
                      className={`py-2 px-2 rounded-xl text-center border text-[11px] font-bold active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer ${
                        suggestType === cat 
                          ? "bg-amber-400 text-slate-950 border-amber-400 shadow-sm" 
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  placeholder="e.g. (613) 555-0199" 
                  value={suggestPhone}
                  onChange={e => setSuggestPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1">Your Name / Tag</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kelly (#7 Mom)" 
                  value={suggestAuthor}
                  onChange={e => setSuggestAuthor(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setIsRestaurantModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black hover:bg-amber-300 shadow-sm active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                >
                  Add & Vote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parent Hub Tip Modal */}
      {activeModalGameId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#111827] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-slate-800/90">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  Add Hub Tip
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  For {activeModalGameId === "hotel" ? tournament.hotel.name : (games.find(g => g.id === activeModalGameId)?.venueName || "this gym")}
                </p>
              </div>
              <button 
                onClick={() => setActiveModalGameId(null)}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTip} className="space-y-3.5">
              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1.5">Category</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                  {[
                    { id: "parking", label: "🅿️ Parking" },
                    { id: "gate", label: "🎟️ Gate" },
                    { id: "concessions", label: "☕ Food" },
                    { id: "note", label: "📌 Note" }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTipCategory(cat.id as any)}
                      className={`py-2 px-1 rounded-xl text-center border active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer ${
                        tipCategory === cat.id 
                          ? "bg-amber-400 text-slate-950 border-amber-400 shadow-sm font-black" 
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1">Headline</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Bring cash for gate" 
                  value={tipTitle}
                  onChange={e => setTipTitle(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1">What should parents know?</label>
                <textarea 
                  required
                  rows={2}
                  maxLength={140}
                  placeholder="e.g. Lot P5 is full. Gate entry is around the back entrance." 
                  value={tipContent}
                  onChange={e => setTipContent(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1">Your Name / Tag (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dave (#14 Dad)" 
                  value={tipAuthor}
                  onChange={e => setTipAuthor(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setActiveModalGameId(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black hover:bg-amber-300 shadow-sm active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                >
                  Post Tip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick-Edit Game Drawer (Bottom Slide-Up Sheet) */}
      {editingGame && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
          onClick={() => setEditingGame(null)}
        >
          <div
            className="fixed bottom-0 inset-x-0 bg-[#111827] border-t border-slate-800 shadow-2xl rounded-t-3xl p-6 max-w-lg mx-auto z-50 animate-in slide-in-from-bottom duration-200 text-white max-h-[85dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                  MANAGER QUICK-EDIT
                </span>
                <h3 className="text-base font-black text-white mt-1.5">
                  Edit Game {games.findIndex((g) => g.id === editingGame.id) + 1}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingGame(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGameEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1.5">
                    Tip-Off Time
                  </label>
                  <input
                    type="time"
                    value={editTipOffTime}
                    onChange={(e) => setEditTipOffTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1.5">
                    Game Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as GameStatus)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-mono text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Warmups">Warmups</option>
                    <option value="Live">Live</option>
                    <option value="Final">Final</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1.5">
                  Court / Gym Location
                </label>
                <input
                  type="text"
                  value={editCourtLocation}
                  onChange={(e) => setEditCourtLocation(e.target.value)}
                  placeholder="e.g. Rim Park — Court 3"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1.5">
                  Opponent Name
                </label>
                <input
                  type="text"
                  value={editOpponent}
                  onChange={(e) => setEditOpponent(e.target.value)}
                  placeholder="e.g. London Ramblers"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1.5">
                  Arrival Buffer (Before Tip-Off)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 45, 60].map((buf) => (
                    <button
                      key={buf}
                      type="button"
                      onClick={() => setEditWarmupBuffer(buf)}
                      className={`py-2 px-3 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer ${
                        editWarmupBuffer === buf
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      {buf}m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1.5">
                  Jersey Color
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["White (Home)", "Dark / Black (Away)"] as JerseyColor[]).map((jersey) => (
                    <button
                      key={jersey}
                      type="button"
                      onClick={() => setEditJerseyColor(jersey)}
                      className={`py-2.5 px-3 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer ${
                        editJerseyColor === jersey
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                          : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      {jersey}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingGame(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Ingestion Launcher Modal */}
      {isIngestModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setIsIngestModalOpen(false)}
        >
          <div
            className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-white space-y-4 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                  MANAGER SUITE • GEMINI 2.5 FLASH VISION
                </span>
                <h3 className="text-base font-black text-white mt-1.5">
                  Update Run Sheet (AI OCR / Import)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIngestModalOpen(false)}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ingestion Mode Switcher: AI Screenshot Vision vs Raw Text Fallback */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIngestMode("screenshots");
                  setIngestError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  ingestMode === "screenshots"
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Screenshots
              </button>
              <button
                type="button"
                onClick={() => {
                  setIngestMode("text");
                  setIngestError(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  ingestMode === "text"
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Raw Text
              </button>
            </div>

            {ingestMode === "screenshots" ? (
              <div className="space-y-3">
                <input
                  ref={ingestFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      appendIngestFiles(e.target.files);
                      e.target.value = "";
                    }
                  }}
                />

                {/* Dashed Dropzone Area */}
                <div
                  onClick={() => ingestFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      appendIngestFiles(e.dataTransfer.files);
                    }
                  }}
                  className="border-2 border-dashed border-slate-700 hover:border-amber-400/70 bg-slate-900/70 hover:bg-slate-900 rounded-xl p-5 text-center transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                    <Upload className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-xs font-extrabold text-white">
                    Drop tournament screenshots here, or click to browse
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Supports PNG, JPG, WebP • Or press Cmd/Ctrl+V to paste from clipboard
                  </p>
                </div>

                {/* Compact Thumbnail Previews with Badge Count & Remove (X) */}
                {ingestImages.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-r">
                        Attached Screenshots ({ingestImages.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          ingestImages.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                          setIngestImages([]);
                        }}
                        className="text-[10px] font-mono text-slate-400 hover:text-slate-200 underline cursor-pointer"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {ingestImages.map((img, i) => (
                        <div
                          key={img.id}
                          className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video"
                        >
                          <img
                            src={img.previewUrl}
                            alt={`Schedule screenshot ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 bg-slate-950/85 text-amber-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                            #{i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeIngestImage(img.id)}
                            aria-label={`Remove screenshot ${i + 1}`}
                            className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/85 hover:bg-red-500 text-white transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading / Progress State */}
                {isAnalyzingScreenshots && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
                    <div className="text-xs">
                      <span className="font-black text-amber-300 block">
                        Extracting game times, gyms, and jersey assignments...
                      </span>
                      <span className="text-[11px] text-slate-300 font-mono">
                        Gemini 2.5 Flash Vision is parsing your schedule screenshot(s)
                      </span>
                    </div>
                  </div>
                )}

                {ingestError && (
                  <div className="bg-red-950/50 border border-red-500/40 rounded-xl p-3 text-xs text-red-200 font-medium">
                    {ingestError}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-slate-400 font-mono text-xs uppercase tracking-wider mb-1.5">
                  Paste Raw Schedule / Bracket Text or URL
                </label>
                <textarea
                  value={ingestRawText}
                  onChange={(e) => setIngestRawText(e.target.value)}
                  placeholder={"10:30 AM | vs London Ramblers | Rim Park — Court 3\n4:00 PM | vs Burlington Force | Rim Park — Court 1"}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-3 text-sm font-mono focus:border-amber-500 focus:outline-none min-h-[140px]"
                />
              </div>
            )}

            {/* Parse & Preview Drawer with Inline Editing */}
            {parsedPreviewGames && parsedPreviewGames.length > 0 && (
              <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-3.5 space-y-3 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                    Parsed Preview ({parsedPreviewGames.length} Games)
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyIngestedSchedule}
                    className="text-[11px] font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Apply to Run Sheet
                  </button>
                </div>

                {parsedPreviewGames.map((g, idx) => {
                  const bufMins = g.warmupBufferMin || 30;
                  const arrivalMins = getArrivalCallMinutes(g.tipOffMinutes, bufMins);
                  return (
                    <div
                      key={g.id}
                      className="text-xs border-t border-slate-800 pt-2.5 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-amber-300 font-black">
                            {g.dayLabel ? `${g.dayLabel} • ` : ""}{formatTime(g.tipOffMinutes)}
                          </span>
                          <span className="inline-flex items-center border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-[10px] px-1.5 py-0.5 rounded-r">
                            Arrive {formatTime(arrivalMins)} (30m)
                          </span>
                        </div>
                        <span className="inline-flex items-center border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-r">
                          {g.jerseyColor || "White (Home)"}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        Venue: <span className="text-slate-200 font-semibold">{g.venueName}</span>
                      </div>

                      {/* Quick Inline Editing for Opponent Name and Court Number */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                            Opponent #{idx + 1}
                          </label>
                          <input
                            type="text"
                            value={g.opponent}
                            onChange={(e) => updatePreviewGame(g.id, { opponent: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase mb-0.5">
                            Court
                          </label>
                          <input
                            type="text"
                            value={g.court}
                            onChange={(e) => updatePreviewGame(g.id, { court: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsIngestModalOpen(false);
                  setParsedPreviewGames(null);
                  setIngestError(null);
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close
              </button>
              {ingestMode === "screenshots" ? (
                <button
                  type="button"
                  disabled={isAnalyzingScreenshots}
                  onClick={handleAnalyzeScreenshots}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isAnalyzingScreenshots ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Analyze Screenshots with AI
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleParseSchedule}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Parse & Preview
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RunSheetContent;
