"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useParams, useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CorridorDirection, getDynamicOriginPresets, computeTravelCorridor } from "@/lib/corridor-engine";
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
  ChevronRight,
  Bell,
  Settings,
  Shirt,
  Pencil,
  Lightbulb,
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
  const [isManagerToolsOpen, setIsManagerToolsOpen] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<"connecting" | "live" | "degraded" | "offline">("connecting");
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

  // Step 2: Any-City Travel Corridor Engine Origin & Direction State + Persistence
  const teamHomeBase = "Ottawa, ON";
  const [departureOrigin, setDepartureOrigin] = useState<string>(teamHomeBase);
  const [corridorDirection, setCorridorDirection] = useState<CorridorDirection>("to_tournament");
  const [isOriginPopoverOpen, setIsOriginPopoverOpen] = useState<boolean>(false);
  const [isCustomOriginMode, setIsCustomOriginMode] = useState<boolean>(false);
  const [customOriginDraft, setCustomOriginDraft] = useState<string>("");
  const originPresets = getDynamicOriginPresets(teamHomeBase, "Oakville, ON");

  useEffect(() => {
    if (!slug) return;
    try {
      const savedOrigin = window.localStorage.getItem(`awayday_origin_${slug}`);
      if (savedOrigin && savedOrigin.trim()) {
        setDepartureOrigin(savedOrigin.trim());
      }
      const savedDir = window.localStorage.getItem(`awayday_corridor_dir_${slug}`);
      if (savedDir === "to_tournament" || savedDir === "trip_home") {
        setCorridorDirection(savedDir);
      }
    } catch {
      // Ignore storage errors
    }
  }, [slug]);

  const handleSetCorridorDirection = (nextDir: CorridorDirection) => {
    setCorridorDirection(nextDir);
    try {
      window.localStorage.setItem(`awayday_corridor_dir_${slug}`, nextDir);
    } catch {
      // Ignore storage errors
    }
  };

  const handleSelectOriginPreset = (preset: string) => {
    if (preset === "Custom City / Zip..." || preset === "Custom...") {
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
  const [userRsvpSeats, setUserRsvpSeats] = useState<number>(0);
  const [isEditingRsvp, setIsEditingRsvp] = useState<boolean>(false);

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
    const storageRsvpKey = `awayday_rsvp_${slug}`;

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
      const savedRsvp = window.localStorage.getItem(storageRsvpKey);
      if (savedRsvp !== null) {
        const parsedRsvp = parseInt(savedRsvp, 10);
        if (!isNaN(parsedRsvp) && parsedRsvp > 0) {
          setUserRsvpSeats(parsedRsvp);
          setUserFinalAttendance("attending");
        }
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
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setSyncStatus("live");
        } else if (status === "TIMED_OUT" || status === "CHANNEL_ERROR" || status === "CLOSED") {
          setSyncStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "degraded");
        }
      });

    realtimeChannelRef.current = channel;

    const handleOnline = () => {
      setSyncStatus((prev) => (prev === "offline" ? "connecting" : prev));
    };
    const handleOffline = () => {
      setSyncStatus("offline");
    };
    if (typeof window !== "undefined") {
      if (!navigator.onLine) setSyncStatus("offline");
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

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
      if (e.key === storageRsvpKey) {
        const parsedRsvp = e.newValue ? parseInt(e.newValue, 10) : 0;
        setUserRsvpSeats(!isNaN(parsedRsvp) && parsedRsvp > 0 ? parsedRsvp : 0);
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Clean up subscriptions on component unmount
    return () => {
      realtimeChannelRef.current = null;
      supabase.removeChannel(channel);
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
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

  const [activeTab, setActiveTab] = useState<"schedule" | "fuel" | "travel" | "hotel">("schedule");
  const [openTipsGameId, setOpenTipsGameId] = useState<string | null>(null);
  const [heroTipsManualState, setHeroTipsManualState] = useState<Record<string, boolean>>({});

  // Backwards-compatibility: map URL hash or query param 'hotel' / 'travel' to 'travel'
  useEffect(() => {
    const tabParam = (searchParams.get("tab") || "").toLowerCase();
    const hashVal = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "").toLowerCase() : "";
    if (tabParam === "hotel" || tabParam === "travel" || hashVal === "hotel" || hashVal === "travel" || hashVal === "section-hotel") {
      setActiveTab("travel");
    } else if (tabParam === "fuel" || hashVal === "fuel") {
      setActiveTab("fuel");
    }
  }, [searchParams]);

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
  const isJoiningWinner = userFinalAttendance === "attending" || userRsvpSeats > 0;
  const userPartyTotal = userParty.players + userParty.parents;

  // Post-lock RSVP handlers ("Count Us In" & seat stepper) — explicitly enabled even when isPollLocked === true
  const handleCountUsIn = (customSeats?: number) => {
    if (!winningOption) return;
    const targetSeats = customSeats !== undefined ? customSeats : Math.max(2, userPartyTotal);
    const deltaSeats = targetSeats - userRsvpSeats;

    setUserFinalAttendance("attending");
    setUserRsvpSeats(targetSeats);
    setIsEditingRsvp(false);

    try {
      window.localStorage.setItem(`awayday_rsvp_${slug}`, String(targetSeats));
    } catch {
      // Ignore storage errors
    }

    if (deltaSeats !== 0) {
      const updatedOptions = options.map((opt) => {
        if (opt.id !== winningOption.id) return opt;
        const baseSeats = opt.totalSeats || opt.votes * 2;
        const nextTotalSeats = Math.max(0, baseSeats + deltaSeats);
        const addPlayers = deltaSeats > 0 ? Math.min(deltaSeats, userParty.players || 1) : 0;
        const addParents = deltaSeats > 0 ? Math.max(0, deltaSeats - addPlayers) : deltaSeats;
        return {
          ...opt,
          totalSeats: nextTotalSeats,
          playerCount: Math.max(0, opt.playerCount + addPlayers),
          parentCount: Math.max(0, opt.parentCount + addParents),
        };
      });
      setOptions(updatedOptions);
      broadcastPollOptionsSync(updatedOptions);
    }
  };

  const handleAdjustRsvpSeats = (delta: number) => {
    if (!winningOption) return;
    const baseRsvp = userRsvpSeats > 0 ? userRsvpSeats : (isVoterOfWinner ? userPartyTotal : 0);
    const nextRsvp = Math.max(0, baseRsvp + delta);
    const diff = nextRsvp - baseRsvp;
    if (diff === 0) return;

    setUserRsvpSeats(nextRsvp);
    setUserFinalAttendance(nextRsvp > 0 ? "attending" : "declined");

    try {
      if (nextRsvp > 0) {
        window.localStorage.setItem(`awayday_rsvp_${slug}`, String(nextRsvp));
      } else {
        window.localStorage.removeItem(`awayday_rsvp_${slug}`);
      }
    } catch {
      // Ignore storage errors
    }

    const updatedOptions = options.map((opt) => {
      if (opt.id !== winningOption.id) return opt;
      const currentSeats = opt.totalSeats || opt.votes * 2;
      return {
        ...opt,
        totalSeats: Math.max(0, currentSeats + diff),
        parentCount: Math.max(0, opt.parentCount + diff),
      };
    });
    setOptions(updatedOptions);
    broadcastPollOptionsSync(updatedOptions);
  };

  const handleSplitOff = () => {
    if (!winningOption) return;
    const seatsToRemove = userRsvpSeats;
    setUserFinalAttendance("declined");
    setUserRsvpSeats(0);
    setIsEditingRsvp(false);

    try {
      window.localStorage.removeItem(`awayday_rsvp_${slug}`);
    } catch {
      // Ignore storage errors
    }

    if (seatsToRemove > 0) {
      const updatedOptions = options.map((opt) => {
        if (opt.id !== winningOption.id) return opt;
        const currentSeats = opt.totalSeats || opt.votes * 2;
        return {
          ...opt,
          totalSeats: Math.max(0, currentSeats - seatsToRemove),
          parentCount: Math.max(0, opt.parentCount - seatsToRemove),
        };
      });
      setOptions(updatedOptions);
      broadcastPollOptionsSync(updatedOptions);
    }
  };

  const confirmedReservationSeats = winningOption
    ? (winningOption.totalSeats || winningOption.votes * 2)
    : 0;

  const confirmedPlayers = winningOption ? winningOption.playerCount : 0;

  const confirmedParents = winningOption ? winningOption.parentCount : 0;

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

  // Compute Travel Corridor Plan based on departureOrigin, direction, first game, and final game
  const firstGame = games[0];
  const finalGame = games[games.length - 1] || games[0];
  const firstEventArrivalMins = firstGame
    ? getArrivalCallMinutes(firstGame.tipOffMinutes, firstGame.warmupBufferMin || 30)
    : 915;
  const firstEventDayLabel = firstGame?.dayLabel || "Sat, Oct 24";
  const corridorPlan = computeTravelCorridor(
    departureOrigin,
    "Oakville, ON",
    tournament.hotel.name,
    firstEventArrivalMins,
    firstEventDayLabel,
    {
      direction: corridorDirection,
      teamHomeBase,
      finalGameTipOffMinutes: finalGame?.tipOffMinutes ?? 870,
      finalGameDayLabel: finalGame?.dayLabel || "Sun, Oct 25",
      finalGameVenue: finalGame?.venueName || tournament.hotel.name,
    }
  );

  const syncPillMeta =
    syncStatus === "connecting"
      ? {
          label: "CONNECTING",
          pillClass: "bg-emerald-50 border border-emerald-200/60 text-emerald-700",
          dotClass: "bg-emerald-500 animate-pulse",
        }
      : syncStatus === "offline"
        ? {
            label: "OFFLINE",
            pillClass: "bg-slate-100 border border-slate-200/80 text-slate-600",
            dotClass: "bg-slate-400",
          }
        : {
            label: "LIVE SYNC",
            pillClass: "bg-emerald-50 border border-emerald-200/60 text-emerald-700",
            dotClass: "bg-emerald-500 animate-pulse",
          };

  return (
    <div className="stadium-canvas font-sans bg-[#F8F7F3] text-[#1D2935] w-full pb-28">
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-[#F8F7F3]/90 backdrop-blur-md px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-baseline select-none tracking-tight">
            <span className="text-[28px] leading-none font-black italic text-[#0B192C] tracking-tight pr-0.5 [-webkit-text-stroke:0.45px_#0B192C]">
              Away
            </span>
            <span className="text-[28px] leading-none font-black italic text-[#D59B42] tracking-tight [-webkit-text-stroke:0.45px_#D59B42]">
              Day.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              role="status"
              aria-live="polite"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${syncPillMeta.pillClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${syncPillMeta.dotClass}`} />
              <span>{syncPillMeta.label}</span>
            </div>
            <button
              type="button"
              aria-label="Notifications and hub tips"
              onClick={() => {
                const nextIdx = games.findIndex((g) => !isGameElapsedByClock(g, nowMs));
                const activeGame = nextIdx >= 0 ? games[nextIdx] : undefined;
                if (activeGame) {
                  setHeroTipsManualState((prev) => ({ ...prev, [activeGame.id]: true }));
                }
                if (activeTab !== "schedule") {
                  setActiveTab("schedule");
                }
                window.setTimeout(() => {
                  const tipsEl = document.getElementById("section-hub-tips") || document.getElementById("section-games");
                  tipsEl?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 60);
              }}
              className="w-8 h-8 rounded-full bg-white border border-[#E9E5DE] shadow-xs flex items-center justify-center relative text-[#1D2935] cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D59B42]" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto w-full px-3 sm:px-4 pb-28 pt-1">
        
        {activeTab === "schedule" && (
          <div key="schedule" className="animate-in fade-in-50 duration-200 ease-out">
        {/* Tournament Header Card ("YOUR NEXT AWAY DAY") */}
        <section className="bg-white rounded-[26px] p-4 border-[1.5px] border-[#DCE1E7] shadow-tactile-sm mb-3">
          <div className="flex items-center gap-3.5">
            {/* Left: Rounded travel harbor/cityscape thumbnail */}
            <div
              aria-hidden="true"
              className="w-24 h-24 rounded-2xl object-cover overflow-hidden bg-[#F1F3F5] ring-1 ring-[#DCE1E7] shrink-0 relative"
            >
              <svg viewBox="0 0 96 96" className="w-full h-full object-cover" fill="none">
                <defs>
                  <linearGradient id="awayday-sky" x1="0" y1="0" x2="0" y2="56" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4A9AE2" />
                    <stop offset="65%" stopColor="#A8D4F7" />
                    <stop offset="100%" stopColor="#FCE7BD" />
                  </linearGradient>
                  <linearGradient id="awayday-water" x1="0" y1="56" x2="0" y2="96" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#5D8BB5" />
                    <stop offset="55%" stopColor="#7DA7CC" />
                    <stop offset="100%" stopColor="#4A7399" />
                  </linearGradient>
                </defs>
                <rect width="96" height="58" fill="url(#awayday-sky)" />
                {/* Soft sunlit clouds */}
                <ellipse cx="26" cy="18" rx="18" ry="5" fill="#FFFFFF" fillOpacity="0.65" />
                <ellipse cx="68" cy="14" rx="16" ry="4.5" fill="#FFFFFF" fillOpacity="0.5" />
                {/* Distant sunlit skyline & spires */}
                <path
                  d="M0 56V46H10V40L14 33L18 40V45H26V38H35V44H43V35L47 24L51 35V43H58V37L62 29L66 37V44H75V39H85V45H96V56H0Z"
                  fill="#C89352"
                />
                <path
                  d="M12 56V45H22V41H32V46H45V39H55V45H68V40H80V46H96V56H12Z"
                  fill="#34495E"
                  fillOpacity="0.55"
                />
                {/* Lush shoreline foliage */}
                <path
                  d="M0 57C8 50 18 51 26 55C35 49 48 50 58 55C68 49 82 50 96 55V59H0V57Z"
                  fill="#5E8F3E"
                />
                {/* Harbor water */}
                <rect y="57" width="96" height="39" fill="url(#awayday-water)" />
                {/* Golden water reflections */}
                <rect x="42" y="61" width="14" height="2" rx="1" fill="#FCE7BD" fillOpacity="0.65" />
                <rect x="36" y="66" width="24" height="1.5" rx="0.75" fill="#FCE7BD" fillOpacity="0.45" />
                <rect x="14" y="74" width="18" height="1.5" rx="0.75" fill="#FFFFFF" fillOpacity="0.35" />
                <rect x="58" y="79" width="22" height="1.5" rx="0.75" fill="#FFFFFF" fillOpacity="0.35" />
                {/* Marina sailboats */}
                <path d="M21 34L27 59H19L21 34Z" fill="#FFFFFF" />
                <path d="M19.5 39L14 59H19.5V39Z" fill="#F1F5F9" />
                <path d="M13 60H28L26 64H15L13 60Z" fill="#1D2935" />
                <path d="M51 38L56 60H49.5L51 38Z" fill="#FFFFFF" />
                <path d="M49.5 43L45 60H49.5V43Z" fill="#E2E8F0" />
                <path d="M44 61H57L55.5 64.5H45.5L44 61Z" fill="#B95835" />
                <path d="M75 41L79.5 61H73.5L75 41Z" fill="#FFFFFF" />
                <path d="M72 62H81L79.5 65H73.5L72 62Z" fill="#1D2935" />
              </svg>
            </div>

            {/* Right: Tournament metadata & Manager Tools trigger */}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-extrabold tracking-wider text-[#D59B42] uppercase">
                YOUR NEXT AWAY DAY
              </div>
              <div className="flex items-start justify-between gap-2 mt-0.5">
                <h1 className="text-base font-extrabold text-[#0F2942] leading-tight">
                  {tournament.name}
                </h1>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsManagerToolsOpen((prev) => !prev)}
                    aria-expanded={isManagerToolsOpen}
                    className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg border border-[#D59B42]/40 bg-[#FFF9EE] hover:bg-[#FDF3DE] text-[#D59B42] text-[10px] font-bold leading-tight text-left transition-colors cursor-pointer"
                  >
                    <Settings className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>
                      MANAGER
                      <br />
                      TOOLS
                    </span>
                  </button>
                )}
              </div>

              <a
                href={getMapsUrl(tournament.primaryHubAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0F2942] transition-colors mt-1"
              >
                <svg
                  aria-hidden="true"
                  className="w-3.5 h-3.5 text-[#0F2942] fill-current shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span className="truncate">{tournament.city}</span>
              </a>

              <div className="flex items-center gap-1.5 text-xs font-medium text-[#5C6B7B] mt-0.5">
                <CalendarDays className="w-3.5 h-3.5 text-[#0F2942] shrink-0" aria-hidden="true" />
                <span>{tournament.dates}</span>
              </div>
            </div>
          </div>

          {isAdmin && isManagerToolsOpen && (
            <div className="mt-3 pt-2.5 border-t border-[#DCE1E7] flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Manager Actions
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setParsedPreviewGames(null);
                    setIsIngestModalOpen(true);
                  }}
                  className="bg-[#F1F3F5] hover:bg-[#E2E8F0] text-[#0F2942] border border-[#DCE1E7] text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="sm:hidden">+ Run Sheet</span>
                  <span className="hidden sm:inline">+ Update Run Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsManagerToolsOpen(false);
                    handleExitAdmin();
                  }}
                  title="Exit Admin Mode"
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-[#DCE1E7] text-xs font-medium px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-[#D59B42]" aria-hidden="true" /> Exit Admin
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Active Hero Game Card, Unified Hub Tips & Following Game Preview */}
        {(() => {
          const nextGameIndex = games.findIndex((g) => !isGameElapsedByClock(g, nowMs));
          const nextGame = nextGameIndex >= 0 ? games[nextGameIndex] : undefined;
          if (!nextGame) {
            return (
              <section className="bg-white rounded-[26px] p-4 border-[1.5px] border-[#DCE1E7] shadow-tactile-sm mb-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" /> Session Wrap
                  </span>
                  <span className="bg-[#F1F3F5] text-[#5C6B7B] text-[11px] font-bold px-3 py-1 rounded-full">
                    {games.length} / {games.length} Final
                  </span>
                </div>
                <h2 className="text-lg font-bold tracking-tight text-[#0F2942]">
                  Tournament Schedule Complete
                </h2>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  All {games.length} scheduled matchups for {tournament.name} have concluded. Safe travels home!
                </p>
                {isAdmin && (
                  <div className="pt-2.5 border-t border-[#DCE1E7] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleResetGamesStatus}
                      className="text-xs font-semibold text-[#0F2942] bg-[#F1F3F5] border border-[#DCE1E7] hover:bg-[#E2E8F0] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
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
          const isAwayHero =
            (nextGame.jerseyColor || "").toLowerCase().includes("away") ||
            (nextGame.jerseyColor || "").toLowerCase().includes("black") ||
            (nextGame.matchup || "").includes(" at ");
          const heroJerseyShort =
            (nextGame.jerseyColor || "").replace(/\s*\((Home|Away)\)/i, "").trim() ||
            (isAwayHero ? "Dark" : "White");
          const heroCourtLabel = /^court\b/i.test(nextGame.court.trim())
            ? nextGame.court.trim()
            : `Court ${nextGame.court.trim()}`;
          const heroVenueMapsQuery =
            [nextGame.venueName, nextGame.venueAddress, nextGame.city].filter(Boolean).join(", ") ||
            nextGame.venueAddress ||
            nextGame.venueName;

          const followingGame = games[nextGameIndex + 1];
          const followingSameDayGame =
            followingGame && followingGame.dayLabel === nextGame.dayLabel
              ? followingGame
              : undefined;

          const heroGameAlerts = alerts.filter((a) => a.gameId === nextGame.id);
          const activeHeroTips: Array<{
            id: string;
            tag?: string;
            durationBadge?: string;
            title: string;
            content: string;
            author?: string;
            upvotes?: number;
            alertId?: string;
            isQuickTurnaround?: boolean;
          }> = [];

          // Inject Quick Turnaround (or inter-game downtime window) as the top featured tip inside Hub Tips
          if (nextGame.downtimeAfter) {
            const isQuickTurnaroundWindow = /quick turnaround|stay on-site/i.test(
              `${nextGame.downtimeAfter.type} ${nextGame.downtimeAfter.note}`
            );
            activeHeroTips.push({
              id: `turnaround-${nextGame.id}`,
              tag: isQuickTurnaroundWindow ? "QUICK TURNAROUND" : "FUEL WINDOW",
              durationBadge: nextGame.downtimeAfter.duration,
              title: isQuickTurnaroundWindow
                ? "Quick Turnaround — Stay On-Site"
                : `${nextGame.downtimeAfter.duration} — ${nextGame.downtimeAfter.type}`,
              content: nextGame.downtimeAfter.note,
              isQuickTurnaround: isQuickTurnaroundWindow,
            });
          }

          if (
            followingSameDayGame &&
            followingSameDayGame.jerseyColor &&
            followingSameDayGame.jerseyColor !== nextGame.jerseyColor &&
            !heroGameAlerts.some((a) => /jersey|switch/i.test(`${a.title} ${a.content}`))
          ) {
            activeHeroTips.push({
              id: `jersey-${nextGame.id}`,
              tag: "JERSEY CHANGE",
              title: `Pack ${followingSameDayGame.jerseyColor} for Next Game`,
              content: `Same-day matchup at ${formatTime(followingSameDayGame.tipOffMinutes)} (${followingSameDayGame.venueName} • ${followingSameDayGame.court}).`,
            });
          }

          heroGameAlerts.forEach((a) => {
            const isTurnaroundAlert = /turnaround/i.test(`${a.title} ${a.content}`);
            const inferredTag = isTurnaroundAlert
              ? "QUICK TURNAROUND"
              : /urgent/i.test(`${a.title} ${a.content}`)
                ? "URGENT"
                : a.type.toUpperCase();
            activeHeroTips.push({
              id: a.id,
              tag: inferredTag,
              title: a.title,
              content: a.content,
              author: a.author,
              upvotes: a.upvotes,
              alertId: a.id,
              isQuickTurnaround: isTurnaroundAlert,
            });
          });

          const hasAutoExpandTag = activeHeroTips.some(
            (tip) => tip.isQuickTurnaround || tip.tag === "QUICK TURNAROUND" || tip.tag === "URGENT"
          );
          const isHeroTipsOpen =
            heroTipsManualState[nextGame.id] !== undefined
              ? heroTipsManualState[nextGame.id]
              : hasAutoExpandTag;

          return (
            <>
              {/* Active Hero Game Card (Warm Amber Glow Focused Solely Here) */}
              <section className="hero-card-bloom relative rounded-[28px] bg-white border-[1.5px] border-[#DCE1E7] p-4 shadow-[0_12px_36px_-6px_rgba(213,155,66,0.20),0_4px_16px_rgba(0,0,0,0.03)] mb-3">
                {/* Top Row (Pill Badges) */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className="bg-[#FDEFD9] text-[#0F2942] text-[11px] font-black tracking-wider px-3 py-1 rounded-full uppercase">
                    {nextGame.status === "Live" ? "LIVE GAME" : "NEXT GAME"}
                  </span>
                  <span className="bg-[#F1F3F5] text-[#5C6B7B] text-[11px] font-bold px-3 py-1 rounded-full">
                    Game {nextGameIndex + 1}
                  </span>
                </div>

                {/* Matchup & Time Hero (Gym-First Hierarchy with Elevated Court Badge) */}
                <div className="flex items-start gap-4">
                  <div
                    aria-hidden="true"
                    className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#FFB865] via-[#F68B28] to-[#D95D08] shadow-[0_4px_14px_rgba(217,93,8,0.4),inset_0_2px_4px_rgba(255,255,255,0.7)] flex items-center justify-center shrink-0 ring-4 ring-[#FDEFD9]"
                  >
                    <svg
                      className="w-10 h-10 text-[#2B1006] stroke-current"
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="9.5" />
                      <path d="M12 2.5v19" />
                      <path d="M5.2 5.2c3.5 3.5 3.5 10.1 0 13.6" />
                      <path d="M18.8 5.2c-3.5 3.5-3.5 10.1 0 13.6" />
                      <path d="M2.5 12h19" />
                    </svg>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-3xl sm:text-4xl font-black text-[#0F2942] tracking-tight leading-none tabular-nums">
                        {formatTime(nextGame.tipOffMinutes)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0F2942] text-white text-xs font-black tracking-wide uppercase shadow-xs">
                        <span aria-hidden="true">🏀</span> {heroCourtLabel}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-extrabold text-[#0F2942] mt-1 leading-snug">
                      vs {nextGame.opponent}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mt-1">
                      <svg
                        aria-hidden="true"
                        className="w-3.5 h-3.5 text-[#0F2942] fill-current shrink-0"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <span className="truncate">{nextGame.venueName}</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-[#E9ECEF] my-3.5" />

                {/* 3-Column Timing Strip (Chunky Solid Silhouettes & Sculpted Trophy) */}
                <div className="divide-x divide-[#E9ECEF] flex items-start text-center py-1">
                  <div className="flex-1 px-1 flex flex-col items-center">
                    <svg
                      aria-hidden="true"
                      className="w-7 h-7 sm:w-8 sm:h-8 text-[#0B192C] fill-current mx-auto mb-1"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v9c0 .55.45 1 1 1h1.5c.55 0 1-.45 1-1v-1h11v1c0 .55.45 1 1 1H20c.55 0 1-.45 1-1v-9l-2.08-5.99zM6.5 6h11l1.04 3H5.46l1.04-3zM7.5 16c-.83 0-1.5-.67-1.5-1.5S6.67 13 7.5 13s1.5.67 1.5 1.5S8.33 16 7.5 16zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-600">
                      Depart
                    </span>
                    <span className="text-base sm:text-lg font-black text-[#0F2942] tabular-nums mt-0.5 leading-tight">
                      {formatTime(nextDepart)}
                    </span>
                  </div>

                  <div className="flex-1 px-1 flex flex-col items-center">
                    <svg
                      aria-hidden="true"
                      className="w-7 h-7 sm:w-8 sm:h-8 text-[#0B192C] fill-current mx-auto mb-1"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7.12 11.45 7.42 11.71.34.3.82.3 1.16 0C12.88 21.45 20 15.25 20 10c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-600">
                      Arrive
                    </span>
                    <span className="text-base sm:text-lg font-black text-[#0F2942] tabular-nums mt-0.5 leading-tight">
                      {formatTime(nextArrival)}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 mt-0.5">
                      ({bufferMins} min buffer)
                    </span>
                  </div>

                  <div className="flex-1 px-1 flex flex-col items-center">
                    <svg
                      aria-hidden="true"
                      className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-1 drop-shadow-xs"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <defs>
                        <linearGradient id="awayday-trophy-cup" x1="6" y1="3" x2="18" y2="16" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#FAD275" />
                          <stop offset="48%" stopColor="#DF9E38" />
                          <stop offset="100%" stopColor="#B67418" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M6.5 5H4.5C3.67 5 3 5.67 3 6.5V8c0 2.35 1.72 4.3 3.98 4.68M17.5 5h2c.83 0 1.5.67 1.5 1.5V8c0 2.35-1.72 4.3-3.98 4.68"
                        stroke="#C88725"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                      />
                      <path
                        d="M6.5 3.5h11v4.7c0 3.25-2.35 5.95-5.5 6.45-3.15-.5-5.5-3.2-5.5-6.45V3.5z"
                        fill="url(#awayday-trophy-cup)"
                      />
                      <rect x="6" y="2.5" width="12" height="2" rx="1" fill="#B67418" />
                      <rect x="6.5" y="2.8" width="11" height="0.9" rx="0.45" fill="#FDE6A6" fillOpacity="0.8" />
                      <path
                        d="M8.5 5.5v3.2c0 1.6.7 3.05 1.85 3.95"
                        stroke="#FFF3CC"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeOpacity="0.75"
                      />
                      <rect x="10.4" y="14.2" width="3.2" height="3.3" rx="0.8" fill="#C88725" />
                      <path d="M8 17.5h8l.8 2.5H7.2L8 17.5z" fill="#9A6218" />
                      <rect x="6.5" y="19.8" width="11" height="1.7" rx="0.85" fill="#7C4B0E" />
                    </svg>
                    <span className="text-xs font-semibold text-slate-600">
                      Tip-Off
                    </span>
                    <span className="text-base sm:text-lg font-black text-[#0F2942] tabular-nums mt-0.5 leading-tight">
                      {formatTime(nextGame.tipOffMinutes)}
                    </span>
                  </div>
                </div>

                {/* Integrated Nested Travel Footnote */}
                <div className="mt-2 pt-2 border-t border-[#E9ECEF] flex items-center justify-between gap-2 text-[11px] text-[#5C6B7B] font-medium">
                  <span className="flex items-center gap-1 font-bold text-[#0F2942] shrink-0 tabular-nums">
                    <span aria-hidden="true">🚗</span> {nextGame.hotelTravelMin || 15}m drive
                  </span>
                  <span className="italic truncate">Check Maps for live traffic &amp; weather</span>
                </div>

                {/* Bottom Metadata Strip (Bolder w-5 h-5 Shirt & Emerald Check Circle) */}
                <div className="mt-2.5 pt-2.5 border-t border-[#E9ECEF] flex items-center justify-between text-xs font-semibold text-[#2A435E]">
                  <div className="flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      className="w-5 h-5 text-[#0B192C] fill-current shrink-0"
                      viewBox="0 0 24 24"
                    >
                      <path d="M16.5 3c-1.1 1.35-2.68 2.2-4.5 2.2S8.6 4.35 7.5 3L2 5.5l2.2 4.4 2.8-1.1V21h10V8.8l2.8 1.1L22 5.5 16.5 3z" />
                    </svg>
                    <span>Jerseys: {heroJerseyShort || "White"}</span>
                  </div>
                  <div className="h-4 w-px bg-[#E9ECEF] shrink-0" aria-hidden="true" />
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="w-5 h-5 bg-[#10B981] text-white font-black text-xs flex items-center justify-center rounded-full shadow-xs shrink-0"
                    >
                      <svg
                        className="w-3 h-3 stroke-current"
                        viewBox="0 0 12 12"
                        fill="none"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2.5 6.3L5 8.8L9.5 3.5" />
                      </svg>
                    </span>
                    <span>
                      Team Check-in: {nextGame.status && nextGame.status !== "Upcoming" ? nextGame.status : "Complete"}
                    </span>
                  </div>
                </div>

                {/* Dedicated Full-Width Google Maps Action Button (44px Accessible Tap Height) */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(heroVenueMapsQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 min-h-[44px] flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#0F2942] text-white text-xs font-bold hover:bg-[#1A365D] transition-colors shadow-xs"
                >
                  <svg aria-hidden="true" className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span>Open Directions in Google Maps</span>
                </a>
              </section>

              {/* Unified Hub Tips Collapsible Drawer (Consolidating Quick Turnaround & Facility Alerts) */}
              <section id="section-hub-tips" aria-label="Hub Tips">
                <button
                  type="button"
                  aria-expanded={isHeroTipsOpen}
                  aria-controls="hero-hub-tips-list"
                  onClick={() =>
                    setHeroTipsManualState((prev) => ({
                      ...prev,
                      [nextGame.id]: !isHeroTipsOpen,
                    }))
                  }
                  className="w-full bg-white border-[1.5px] border-[#DCE1E7] rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors shadow-xs mb-3 text-left"
                >
                  <span className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-[#0F2942] shrink-0" aria-hidden="true" />
                    <span className="font-extrabold text-xs tracking-wider uppercase text-[#0F2942]">
                      HUB TIPS
                    </span>
                    <span className="bg-[#E2E8F0] text-[#0F2942] font-black text-xs px-2 py-0.5 rounded-full tabular-nums leading-none">
                      {activeHeroTips.length}
                    </span>
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`w-4 h-4 text-[#5C6B7B] transition-transform duration-200 ${
                      isHeroTipsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isHeroTipsOpen && (
                  <div
                    id="hero-hub-tips-list"
                    className="-mt-1.5 mb-3 bg-white border-[1.5px] border-[#DCE1E7] rounded-2xl p-3 space-y-2 shadow-xs animate-in fade-in-50 slide-in-from-top-1 duration-150"
                  >
                    {activeHeroTips.length === 0 ? (
                      <div className="bg-[#F1F3F5] border border-[#DCE1E7] rounded-xl p-3 text-xs text-slate-500 italic">
                        No facility or turnaround tips posted yet for this matchup.
                      </div>
                    ) : (
                      activeHeroTips.map((tip) => {
                        const isAlertCard =
                          tip.isQuickTurnaround ||
                          tip.tag === "QUICK TURNAROUND" ||
                          tip.tag === "URGENT";

                        if (isAlertCard) {
                          return (
                            <div
                              key={tip.id}
                              className="bg-[#FFF5E6] border border-[#F2C078] text-[#9A6218] rounded-xl p-3 font-medium text-xs space-y-1.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className="font-extrabold text-[#0F2942] text-xs flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-[#9A6218] shrink-0" aria-hidden="true" />
                                  {tip.title}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-white/85 border border-[#F2C078] text-[#9A6218] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                  {tip.durationBadge ? `${tip.durationBadge} • ${tip.tag}` : tip.tag}
                                </span>
                              </div>
                              <p className="text-xs text-[#9A6218] leading-snug">{tip.content}</p>
                              {tip.id.startsWith("turnaround-") && (
                                <div className="pt-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab("fuel")}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F2942] hover:underline cursor-pointer"
                                  >
                                    <span>View Sideline Fuel Options</span>
                                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                                  </button>
                                </div>
                              )}
                              {tip.alertId && (
                                <div className="flex items-center justify-between pt-1.5 border-t border-[#F2C078]/60 text-[11px] text-[#9A6218]">
                                  <span>By {tip.author}</span>
                                  <button
                                    type="button"
                                    onClick={() => upvoteAlert(tip.alertId!)}
                                    className="inline-flex items-center gap-1 font-semibold text-[11px] bg-white hover:bg-[#FFF9EE] border border-[#F2C078] text-[#0F2942] px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                                  >
                                    <ThumbsUp className="w-3 h-3 text-[#9A6218]" aria-hidden="true" /> Helpful ({tip.upvotes})
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={tip.id}
                            className="bg-[#F1F3F5]/65 border border-[#DCE1E7] rounded-xl p-3 space-y-1.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <h4 className="text-xs font-bold tracking-tight text-[#0F2942]">
                                {tip.title}
                              </h4>
                              {tip.tag && (
                                <span className="inline-flex items-center rounded-full bg-[#E2E8F0] text-[#0F2942] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                  {tip.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 leading-snug">{tip.content}</p>
                            {tip.alertId && (
                              <div className="flex items-center justify-between pt-1.5 border-t border-[#DCE1E7] text-[11px] text-slate-500">
                                <span>By {tip.author}</span>
                                <button
                                  type="button"
                                  onClick={() => upvoteAlert(tip.alertId!)}
                                  className="inline-flex items-center gap-1 font-semibold text-[11px] bg-white hover:bg-slate-50 border border-[#DCE1E7] text-[#0F2942] px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                                >
                                  <ThumbsUp className="w-3 h-3 text-[#0F2942]" aria-hidden="true" /> Helpful ({tip.upvotes})
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveModalGameId(nextGame.id)}
                      className="w-full inline-flex items-center justify-center gap-1 bg-[#F1F3F5] hover:bg-[#E2E8F0]/80 border border-[#DCE1E7] rounded-xl py-2 px-3 text-xs font-bold text-[#0F2942] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#0F2942]" aria-hidden="true" /> Add Hub Tip
                    </button>
                  </div>
                )}
              </section>

              {/* Following Game Preview Card (Clean White + Crisp Stone Border + Platinum Badge) */}
              {followingGame && (
                <button
                  type="button"
                  onClick={() => {
                    const cardEl = document.getElementById(`game-card-${followingGame.id}`);
                    cardEl?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="w-full text-left bg-white rounded-[26px] p-4 border-[1.5px] border-[#DCE1E7] shadow-tactile-sm mb-3 flex items-center justify-between cursor-pointer hover:border-[#0F2942]/30 active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      aria-hidden="true"
                      className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#FFB865] via-[#F68B28] to-[#D95D08] shadow-[0_3px_10px_rgba(217,93,8,0.28),inset_0_1.5px_3px_rgba(255,255,255,0.7)] ring-3 ring-[#F1F3F5] flex items-center justify-center shrink-0 overflow-hidden"
                    >
                      <svg
                        className="w-7 h-7 text-[#2B1006] stroke-current"
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="9.5" />
                        <path d="M12 2.5v19" />
                        <path d="M5.2 5.2c3.5 3.5 3.5 10.1 0 13.6" />
                        <path d="M18.8 5.2c-3.5 3.5-3.5 10.1 0 13.6" />
                        <path d="M2.5 12h19" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block bg-[#F1F3F5] text-[#5C6B7B] font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                        FOLLOWING GAME
                      </span>
                      <div className="text-sm font-extrabold text-[#0F2942] mt-1 truncate">
                        vs. {followingGame.opponent}
                      </div>
                      <div className="text-[11px] font-medium text-[#5C6B7B]">
                        View time, venue and travel details
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#5C6B7B] shrink-0" aria-hidden="true" />
                </button>
              )}

              {isAdmin && (
                <section
                  aria-label="Manager Quick-Shift Schedule Controls"
                  className="bg-white border-[1.5px] border-[#DCE1E7] rounded-2xl shadow-xs p-3 mb-3 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#5C6B7B] uppercase">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#0F2942]" aria-hidden="true" />
                      MANAGER QUICK-SHIFT
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMarkFinalAndAdvance(nextGame.id)}
                      className="inline-flex items-center gap-1 border border-[#DCE1E7] bg-[#F1F3F5] hover:bg-[#E2E8F0] text-[#0F2942] rounded-lg px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#10B981]" aria-hidden="true" /> Mark Final
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => shiftGameTime(nextGame.id, -30)}
                      className="bg-white border border-[#DCE1E7] text-[#0F2942] hover:bg-slate-50 font-bold rounded-lg py-1.5 px-3 text-xs shadow-xs active:scale-[0.97] transition-all cursor-pointer tabular-nums"
                    >
                      -30m
                    </button>
                    <button
                      type="button"
                      onClick={() => shiftGameTime(nextGame.id, -15)}
                      className="bg-white border border-[#DCE1E7] text-[#0F2942] hover:bg-slate-50 font-bold rounded-lg py-1.5 px-3 text-xs shadow-xs active:scale-[0.97] transition-all cursor-pointer tabular-nums"
                    >
                      -15m
                    </button>
                    <button
                      type="button"
                      onClick={() => shiftGameTime(nextGame.id, 15)}
                      className="bg-[#F1F3F5] border border-[#DCE1E7] text-[#0F2942] hover:bg-[#E2E8F0] font-bold rounded-lg py-1.5 px-3 text-xs shadow-xs active:scale-[0.97] transition-all cursor-pointer tabular-nums"
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => shiftGameTime(nextGame.id, 30)}
                      className="bg-[#F1F3F5] border border-[#DCE1E7] text-[#0F2942] hover:bg-[#E2E8F0] font-bold rounded-lg py-1.5 px-3 text-xs shadow-xs active:scale-[0.97] transition-all cursor-pointer tabular-nums"
                    >
                      +30m
                    </button>
                  </div>
                </section>
              )}
            </>
          );
        })()}

        {/* Weekend Run-Sheet */}
        <section id="section-games" className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-white border border-[#DCE1E7] text-[#0F2942] shadow-2xs">
                <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
              <h3 className="text-xs font-extrabold tracking-tight uppercase text-[#0F2942]">Weekend Run-Sheet</h3>
            </div>
            <span className="text-[#5C6B7B] text-xs font-semibold tracking-tight tabular-nums">{games.length} Games Scheduled</span>
          </div>

          {games.map((game, index) => {
            const bufferMins = game.warmupBufferMin || 30;
            const arrivalMinutes = getArrivalCallMinutes(game.tipOffMinutes, bufferMins);
            const departMinutes = arrivalMinutes - game.hotelTravelMin;
            const gameAlerts = alerts.filter(a => a.gameId === game.id);
            const showDayHeader = index === 0 || game.dayLabel !== games[index - 1]?.dayLabel;
            const isAwayCard =
              (game.jerseyColor || "").toLowerCase().includes("away") ||
              (game.jerseyColor || "").toLowerCase().includes("black") ||
              (game.matchup || "").includes(" at ");
            const cardJerseyShort =
              (game.jerseyColor || "").replace(/\s*\((Home|Away)\)/i, "").trim() ||
              (isAwayCard ? "Dark" : "White");
            const cardCourtLabel = /^court\b/i.test(game.court.trim())
              ? game.court.trim()
              : `Court ${game.court.trim()}`;
            const cardVenueMapsQuery =
              [game.venueName, game.venueAddress, game.city].filter(Boolean).join(", ") ||
              game.venueAddress ||
              game.venueName;

            return (
              <React.Fragment key={game.id}>
                {showDayHeader && game.dayLabel && (
                  <div className="flex items-center justify-between gap-2 px-1 pt-1">
                    <span className="inline-flex items-center gap-1.5 border-l-2 border-l-[#0F2942] bg-white border border-[#DCE1E7] text-[#0F2942] text-xs font-bold tracking-tight px-2.5 py-1 rounded-r shadow-2xs">
                      <CalendarClock className="w-3.5 h-3.5 text-[#0F2942]" aria-hidden="true" />
                      {game.dayLabel === "Sat, Oct 24" ? "Saturday, Oct 24" : game.dayLabel === "Sun, Oct 25" ? "Sunday, Oct 25" : game.dayLabel}
                    </span>
                    <span className="text-[11px] font-medium text-[#5C6B7B] truncate">
                      {game.venueName}
                    </span>
                  </div>
                )}
              <div id={`game-card-${game.id}`} className="bg-white rounded-[26px] p-4 border-[1.5px] border-[#DCE1E7] shadow-tactile-sm overflow-hidden scroll-mt-20">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[#0F2942] text-xs font-extrabold tracking-tight">
                        Game {index + 1}{game.dayLabel ? <span className="text-[#5C6B7B] font-semibold">{` • ${game.dayLabel}`}</span> : ""}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#0F2942] text-white text-[10px] font-black tracking-wide uppercase px-2 py-0.5 shadow-2xs">
                        <span aria-hidden="true">🏀</span> {cardCourtLabel}
                      </span>
                      {game.telemetryFlag && (
                        <span className="inline-flex items-center rounded-full bg-[#F1F3F5] text-[#5C6B7B] text-[10px] font-bold tracking-tight uppercase px-2 py-0.5">
                          {game.telemetryFlag}
                        </span>
                      )}
                      {game.status && (
                        <span className={`inline-flex items-center rounded-full text-[10px] font-bold tracking-tight uppercase px-2 py-0.5 ${
                          game.status === "Live"
                            ? "bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/25"
                            : game.status === "Delayed"
                            ? "bg-[#FFF5E6] text-[#9A6218] border border-[#F2C078]"
                            : "bg-[#F1F3F5] text-[#5C6B7B]"
                        }`}>
                          {game.status}
                        </span>
                      )}
                      {game.jerseyColor && (
                        <span className="inline-flex items-center rounded-full bg-[#F1F3F5] text-[#0F2942] text-[10px] font-bold tracking-tight px-2 py-0.5">
                          {isAwayCard ? "Away" : "Home"} • {cardJerseyShort}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-extrabold tracking-tight text-[#0F2942] leading-snug">
                      {game.matchup || `vs. ${game.opponent}`}
                    </h3>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => openEditDrawer(game)}
                      title="Quick-Edit Game"
                      aria-label={`Edit Game ${index + 1}`}
                      className="p-1.5 rounded-lg bg-[#F1F3F5] hover:bg-[#E2E8F0] text-[#0F2942] border border-[#DCE1E7] transition-colors cursor-pointer shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Three-Column Timing Display */}
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="bg-[#F1F3F5] border border-[#DCE1E7] px-2 py-2.5 rounded-xl text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B7B]">Depart</span>
                    <span className="block tabular-nums font-black text-sm sm:text-base text-[#0F2942] mt-0.5">{formatTime(departMinutes)}</span>
                    <span className="block text-[11px] text-[#5C6B7B] font-medium mt-0.5">{game.hotelTravelMin || 15}m drive</span>
                  </div>
                  <div className="bg-[#F1F3F5] border border-[#DCE1E7] px-2 py-2.5 rounded-xl text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6B7B]">Gym Arrival</span>
                    <span className="block tabular-nums font-black text-sm sm:text-base text-[#0F2942] mt-0.5">{formatTime(arrivalMinutes)}</span>
                    <span className="block text-[11px] text-[#5C6B7B] font-medium mt-0.5">{bufferMins}m buffer</span>
                  </div>
                  <div className="bg-[#F1F3F5] border border-[#DCE1E7] px-2 py-2.5 rounded-xl text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#0F2942]">Tip-Off</span>
                    <span className="block tabular-nums font-black text-sm sm:text-base text-[#0F2942] mt-0.5">{formatTime(game.tipOffMinutes)}</span>
                    <span className="block text-[11px] text-[#5C6B7B] font-medium mt-0.5">Game time</span>
                  </div>
                </div>

                {/* Nested Travel Footnote */}
                <div className="mt-2 pt-2 border-t border-[#E9ECEF] flex items-center justify-between gap-2 text-[11px] text-[#5C6B7B] font-medium">
                  <span className="flex items-center gap-1 font-bold text-[#0F2942] shrink-0 tabular-nums">
                    <span aria-hidden="true">🚗</span> {game.hotelTravelMin || 15}m drive
                  </span>
                  <span className="italic truncate">Check Maps for live traffic &amp; weather</span>
                </div>

                {/* Venue Details & Streamlined Google Maps Action Button */}
                <div className="mt-3 rounded-2xl bg-[#F1F3F5] border border-[#DCE1E7] p-3">
                  <div className="flex items-center gap-1.5">
                    <svg
                      aria-hidden="true"
                      className="w-3.5 h-3.5 text-[#0F2942] fill-current shrink-0"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span className="font-bold text-[#0F2942] text-xs truncate">{game.venueName}</span>
                  </div>
                  <span className="text-[#5C6B7B] text-[11px] font-medium truncate block ml-5 mt-0.5">
                    {game.venueAddress}, {game.city}
                  </span>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cardVenueMapsQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 min-h-[44px] flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#0F2942] text-white text-xs font-bold hover:bg-[#1A365D] transition-colors shadow-xs"
                  >
                    <svg aria-hidden="true" className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>Open Directions in Google Maps</span>
                  </a>
                </div>

                <div className="border-t border-[#DCE1E7] mt-3 pt-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setOpenTipsGameId(openTipsGameId === game.id ? null : game.id)}
                    aria-expanded={openTipsGameId === game.id}
                    className="w-full flex items-center justify-between gap-2 active:scale-[0.99] transition-transform duration-100 ease-out cursor-pointer"
                  >
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0F2942] flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-[#0F2942]" aria-hidden="true" /> HUB TIPS
                      <span className="bg-[#E2E8F0] text-[#0F2942] font-black text-xs px-2 py-0.5 rounded-full tabular-nums">
                        {gameAlerts.length + (game.downtimeAfter ? 1 : 0)}
                      </span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#5C6B7B] transition-transform duration-200 ${openTipsGameId === game.id ? "rotate-180" : ""}`} />
                  </button>

                  {openTipsGameId === game.id && (
                    <div className="mt-3 space-y-2.5 animate-in fade-in-50 slide-in-from-top-1 duration-200 ease-out">
                      {game.downtimeAfter && (
                        <div className="bg-[#FFF5E6] border border-[#F2C078] text-[#9A6218] rounded-xl p-3 font-medium text-xs space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="font-extrabold text-[#0F2942] text-xs">
                              {game.downtimeAfter.type}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-white/85 border border-[#F2C078] text-[#9A6218] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              {game.downtimeAfter.duration}
                            </span>
                          </div>
                          <p className="text-xs text-[#9A6218] leading-snug">{game.downtimeAfter.note}</p>
                        </div>
                      )}
                      {gameAlerts.length === 0 && !game.downtimeAfter ? (
                        <p className="text-[11px] text-slate-500 font-medium italic">No facility tips posted yet for this gym.</p>
                      ) : (
                        <div className="space-y-2">
                          {gameAlerts.map(alert => (
                            <div key={alert.id} className="bg-[#F1F3F5]/70 border border-[#DCE1E7] rounded-xl p-3 space-y-2">
                              <div>
                                <h4 className="text-xs font-bold text-[#0F2942]">{alert.title}</h4>
                                <p className="text-xs text-slate-600 leading-snug mt-0.5">{alert.content}</p>
                              </div>
                              <div className="flex items-center justify-between border-t border-[#DCE1E7] pt-1.5 text-[11px] text-slate-500">
                                <span>By {alert.author}</span>
                                <button
                                  type="button"
                                  onClick={() => upvoteAlert(alert.id)}
                                  className="flex items-center gap-1.5 font-semibold text-[11px] bg-white border border-[#DCE1E7] hover:bg-slate-50 text-[#0F2942] px-2.5 py-1 rounded-md active:scale-[0.97] transition-all cursor-pointer"
                                >
                                  <ThumbsUp className="w-3 h-3 text-[#0F2942]" /> Helpful ({alert.upvotes})
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveModalGameId(game.id)}
                        className="w-full flex items-center justify-center gap-1 text-xs font-bold text-[#0F2942] bg-[#F1F3F5] hover:bg-[#E2E8F0] px-2.5 py-2 rounded-xl border border-[#DCE1E7] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#0F2942]" /> Add Tip
                      </button>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="border-t border-[#DCE1E7] bg-[#F1F3F5] -mx-4 -mb-4 mt-3 px-4 py-3 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-[#5C6B7B]">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#0F2942]" />
                      <span>Quick-Shift</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        type="button"
                        onClick={() => shiftGameTime(game.id, -30)} 
                        className="bg-white border border-[#DCE1E7] text-[#0F2942] hover:bg-slate-50 font-bold rounded-lg py-1.5 px-2.5 text-xs shadow-xs active:scale-[0.96] transition-all cursor-pointer tabular-nums"
                      >
                        -30m
                      </button>
                      <button 
                        type="button"
                        onClick={() => shiftGameTime(game.id, -15)} 
                        className="bg-white border border-[#DCE1E7] text-[#0F2942] hover:bg-slate-50 font-bold rounded-lg py-1.5 px-2.5 text-xs shadow-xs active:scale-[0.96] transition-all cursor-pointer tabular-nums"
                      >
                        -15m
                      </button>
                      <button 
                        type="button"
                        onClick={() => shiftGameTime(game.id, 15)} 
                        className="bg-white border border-[#DCE1E7] text-[#0F2942] hover:bg-slate-50 font-bold rounded-lg py-1.5 px-2.5 text-xs shadow-xs active:scale-[0.96] transition-all cursor-pointer tabular-nums"
                      >
                        +15m
                      </button>
                      <button 
                        type="button"
                        onClick={() => shiftGameTime(game.id, 30)} 
                        className="bg-white border border-[#DCE1E7] text-[#0F2942] hover:bg-slate-50 font-bold rounded-lg py-1.5 px-2.5 text-xs shadow-xs active:scale-[0.96] transition-all cursor-pointer tabular-nums"
                      >
                        +30m
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </React.Fragment>
            );
          })}
        </section>

          </div>
        )}

        {activeTab === "fuel" && (
          <div key="fuel" className="space-y-3 animate-in fade-in-50 duration-200 ease-out">
        {/* =========================================================
            MEAL INFO SECTION (Dynamically Computed Timestamps)
        ========================================================= */}
        <section id="section-meals" className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-white border border-[#E9E5DE] text-[#D59B42] shadow-2xs">
                <Utensils className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-xs font-bold tracking-tight uppercase text-[#1D2935]">
                {isLunch ? "Midday Fuel (Grab & Go)" : "Team Dinner & Reservation"}
              </h3>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleToggleMealMode}
                className="px-2.5 py-1 rounded-md font-semibold text-xs text-[#D59B42] bg-[#FFF9EE] hover:bg-[#FDF3DE] border border-[#D59B42]/40 active:scale-[0.97] transition-all cursor-pointer"
              >
                Admin Toggle: {isLunch ? "🌙 Show Dinner" : "🥪 Show Lunch"}
              </button>
            )}
          </div>

          {/* Downtime Window Card with Corrected Timestamps */}
          <div className="bg-white rounded-[26px] border-[1.5px] border-[#DCE1E7] shadow-tactile-sm p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold tracking-tight uppercase text-[#1D2935] flex items-center gap-1.5">
                {isLunch ? <Salad className="w-4 h-4 text-[#D59B42]" /> : <Utensils className="w-4 h-4 text-[#D59B42]" />}
                {isLunch ? "Lunch Downtime Window" : "Dinner Downtime Window"}
              </span>
              <span className="inline-flex items-center rounded-md bg-[#FFF9EE] border border-[#D59B42]/40 text-[#D59B42] text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 tabular-nums">
                {windowHours}h {windowRemainingMins}m Window
              </span>
            </div>
            
            <div className="mt-3 flex items-baseline justify-between border-t border-[#E9E5DE] pt-3">
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Available Downtime</p>
                <p className="text-base font-bold text-[#1D2935] tracking-tight mt-0.5 tabular-nums">
                  {formatTime(activeWindowStart)} – {formatTime(activeWindowEnd)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  {isLunch ? "Game 2 Arrival" : "Evening Wind-Down"}
                </p>
                <p className="text-xs font-bold text-[#D59B42] mt-0.5 tabular-nums">
                  {isLunch 
                    ? `Be at gym by ${formatTime(activeWindowEnd)}`
                    : `Back at hotel by ${formatTime(activeWindowEnd)}`}
                </p>
              </div>
            </div>
          </div>

          {/* LUNCH: GRAB & GO */}
          {isLunch ? (
            <div className="bg-white rounded-[26px] border-[1.5px] border-[#DCE1E7] shadow-tactile-sm p-4 transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-bottom-2 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold tracking-tight uppercase text-[#1D2935] flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#D59B42]" /> Fast Athlete Fuel Near Gym
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    No reservations needed — quick wraps, smoothies, &amp; light carbs
                  </p>
                </div>
                <span className="inline-flex items-center rounded-md bg-[#FFF9EE] border border-[#D59B42]/40 text-[#D59B42] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shrink-0">
                  Quick Turnaround
                </span>
              </div>

              <div className="space-y-2 pt-0.5">
                {quickLunchSpots.map((spot, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#F8F7F3] border border-[#E9E5DE] hover:border-[#D59B42]/40 text-xs flex items-center justify-between gap-2 transition-colors">
                    <div className="pr-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold tracking-tight text-[#1D2935]">{spot.name}</span>
                        <span className="inline-flex items-center rounded bg-white border border-[#E9E5DE] text-slate-600 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5">
                          {spot.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                        {spot.distance} • <span className="text-slate-500">{spot.note}</span>
                      </span>
                    </div>

                    <a 
                      href={getMapsUrl(spot.name + " " + spot.address)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="shrink-0 bg-[#1D2935] hover:bg-[#1D2935]/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#D59B42]" /> Map
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* DINNER: FORMAL CONSENSUS & RESERVATION POLL */
            <div className="bg-white rounded-[26px] border-[1.5px] border-[#DCE1E7] shadow-tactile-sm p-4 transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-bottom-2 space-y-3.5">
              {/* Manager "Poll Time-Travel" Dev Toggle */}
              {isAdmin && (
                <div className="bg-[#F8F7F3] border border-[#E9E5DE] rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-[#D59B42] font-bold">
                      Manager Poll Time-Travel
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      State: {isPollLocked ? "Locked" : isPollLockSoon ? "Lock Soon" : "Open"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-md border border-[#E9E5DE]">
                    {([
                      { id: "live", label: "Live Clock" },
                      { id: "open", label: "Force Open" },
                      { id: "lock_soon", label: "Lock Soon" },
                      { id: "locked", label: "Force Locked" },
                    ] as const).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPollTestMode(mode.id)}
                        className={`py-1.5 px-1 rounded text-[10px] font-bold transition-all cursor-pointer truncate ${
                          pollTestMode === mode.id
                            ? "bg-[#FDF9F0] text-[#1D2935] border border-[#D59B42]/40 shadow-2xs"
                            : "text-slate-500 hover:text-[#1D2935]"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-tight uppercase text-[#1D2935] flex items-center gap-1.5">
                  {isPollLocked ? <Lock className="w-3.5 h-3.5 text-[#10B981]" /> : <Timer className="w-3.5 h-3.5 text-[#D59B42]" />}
                  {isPollLocked ? "Confirmed Team Dinner Reservation" : "Team Dinner Reservation Poll"}
                </span>
                <span className="inline-flex items-center rounded-md bg-[#F8F7F3] border border-[#E9E5DE] text-slate-600 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 shrink-0 tabular-nums">
                  {totalVotesCast} votes cast
                </span>
              </div>

              {winningOption && (
                <div className="bg-[#FDF9F0] border border-[#D59B42]/35 rounded-xl p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-tight text-[#1D2935]">
                      🏆 CURRENT LEADER: {winningOption.name}
                    </span>
                    {isPollLocked && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                        🎉 TEAM RESERVATION LOCKED
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-[#D59B42]/20">
                    <span className="text-xs font-bold text-[#1D2935] tabular-nums">
                      Reservation Target: {winningOption.totalSeats || winningOption.votes * 2} Seats ({winningOptionPercent}%)
                    </span>
                    <span className="text-[11px] font-medium text-slate-600 tabular-nums">
                      {confirmedPlayers} Players • {confirmedParents} Parents
                    </span>
                  </div>

                  {winningOption.isDelivery && (
                    <div className="text-[11px] text-[#1D2935] bg-white border border-[#E9E5DE] rounded-lg p-2.5 flex items-center justify-between font-medium">
                      <span>Target Order: <strong className="font-bold text-[#1D2935]">~{estimatedPizzas} Large Pizzas</strong></span>
                      <span className="text-[10px] text-slate-500 font-semibold">1 pie per 2.5 people</span>
                    </div>
                  )}

                  {isPollLocked && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#D59B42]/20">
                      <span className="text-[11px] text-[#1D2935] flex items-center gap-1.5 font-semibold tabular-nums">
                        <PhoneCall className="w-3.5 h-3.5 text-[#10B981]" /> {winningOption.phone}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${winningOption.phone.replace(/[^0-9]/g, "")}`}
                          className="text-xs font-semibold bg-[#1D2935] hover:bg-[#1D2935]/90 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer"
                        >
                          <PhoneCall className="w-3 h-3 text-[#D59B42]" /> Call Restaurant
                        </a>
                        <a
                          href={getMapsUrl(`${winningOption.name} ${winningOption.address}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold bg-white hover:bg-slate-50 text-[#1D2935] border border-[#E9E5DE] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer"
                        >
                          <Navigation className="w-3 h-3 text-[#D59B42]" /> Open in Maps
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isPollLocked && winningOption && !isVoterOfWinner && (
                <div className="bg-[#FDF9F0] border border-[#D59B42]/35 rounded-xl p-3.5 space-y-2.5 animate-in fade-in duration-200 pointer-events-auto">
                  <div>
                    <span className="text-xs font-bold text-[#1D2935] block">
                      {winningOption.name} won the vote!
                    </span>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-snug">
                      You previously picked {options.find(o => o.id === userVotedOptionId)?.name || "another spot"}. Are you joining the team table?
                    </p>
                  </div>

                  {userRsvpSeats > 0 && !isEditingRsvp ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D59B42]/20">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-bold px-2.5 py-1">
                        ✓ Your Party: {userRsvpSeats} Seats Added
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAdjustRsvpSeats(-1)}
                          aria-label="Remove 1 RSVP seat"
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-50 border border-[#E9E5DE] text-[#1D2935] font-bold text-xs active:scale-[0.95] transition-all cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustRsvpSeats(1)}
                          aria-label="Add 1 RSVP seat"
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-50 border border-[#E9E5DE] text-[#1D2935] font-bold text-xs active:scale-[0.95] transition-all cursor-pointer"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingRsvp(true)}
                          className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 border border-[#E9E5DE] text-[#D59B42] text-[11px] font-bold active:scale-[0.96] transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleCountUsIn(Math.max(2, userPartyTotal))}
                        className="flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer bg-[#10B981] hover:bg-emerald-600 text-white shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Count Us In (+{Math.max(2, userPartyTotal)} seats)
                      </button>

                      <button
                        type="button"
                        onClick={handleSplitOff}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold active:scale-[0.97] transition-all cursor-pointer ${
                          userFinalAttendance === "declined"
                            ? "bg-white text-[#1D2935] border border-[#E9E5DE]"
                            : "bg-transparent text-slate-600 hover:bg-white/70"
                        }`}
                      >
                        Splitting Off
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isPollLocked && winningOption && isVoterOfWinner && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 pointer-events-auto">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span className="font-bold text-[#1D2935]">
                      ✓ Your Party: {userRsvpSeats > 0 ? userRsvpSeats : userPartyTotal} Seats Added
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustRsvpSeats(-1)}
                      aria-label="Decrease seats"
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-50 border border-[#E9E5DE] text-[#1D2935] font-bold text-xs active:scale-[0.95] transition-all cursor-pointer"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustRsvpSeats(1)}
                      aria-label="Increase seats"
                      className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-50 border border-[#E9E5DE] text-[#1D2935] font-bold text-xs active:scale-[0.95] transition-all cursor-pointer"
                    >
                      +
                    </button>
                    <span className="inline-flex items-center rounded-md bg-white border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                      Confirmed
                    </span>
                  </div>
                </div>
              )}

              {!isPollLocked && (
                <div className="bg-[#F8F7F3] border border-[#E9E5DE] rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-tight uppercase text-[#1D2935] flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#D59B42]" /> Your Family Count
                    </span>
                    <span className="inline-flex items-center rounded-md bg-[#FFF9EE] border border-[#D59B42]/40 text-[#D59B42] text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 tabular-nums">
                      {userPartyTotal} Seat{userPartyTotal > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between bg-white border border-[#E9E5DE] rounded-lg px-2.5 py-1.5">
                      <span className="text-slate-600 font-semibold text-[11px] uppercase">Players</span>
                      <div className="flex items-center gap-2 font-bold">
                        <button 
                          type="button"
                          onClick={() => updatePartyCounts(-1, 0)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-[#F8F7F3] hover:bg-[#E9E5DE]/60 border border-[#E9E5DE] active:scale-[0.96] text-[#1D2935] transition-all cursor-pointer"
                        >-</button>
                        <span className="w-4 text-center tabular-nums text-sm font-bold text-[#1D2935]">{userParty.players}</span>
                        <button 
                          type="button"
                          onClick={() => updatePartyCounts(1, 0)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-[#F8F7F3] hover:bg-[#E9E5DE]/60 border border-[#E9E5DE] active:scale-[0.96] text-[#1D2935] transition-all cursor-pointer"
                        >+</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-[#E9E5DE] rounded-lg px-2.5 py-1.5">
                      <span className="text-slate-600 font-semibold text-[11px] uppercase">Parents</span>
                      <div className="flex items-center gap-2 font-bold">
                        <button 
                          type="button"
                          onClick={() => updatePartyCounts(0, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-[#F8F7F3] hover:bg-[#E9E5DE]/60 border border-[#E9E5DE] active:scale-[0.96] text-[#1D2935] transition-all cursor-pointer"
                        >-</button>
                        <span className="w-4 text-center tabular-nums text-sm font-bold text-[#1D2935]">{userParty.parents}</span>
                        <button 
                          type="button"
                          onClick={() => updatePartyCounts(0, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-[#F8F7F3] hover:bg-[#E9E5DE]/60 border border-[#E9E5DE] active:scale-[0.96] text-[#1D2935] transition-all cursor-pointer"
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
                    className="py-2 px-3 rounded-lg bg-[#1D2935] hover:bg-[#1D2935]/90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D59B42]" /> Suggest a Spot
                  </button>

                  <button
                    type="button"
                    onClick={handleAddHotelPizzaPreset}
                    className="py-2 px-3 rounded-lg border border-[#D59B42]/40 bg-[#FFF9EE] hover:bg-[#FDF3DE] text-xs font-semibold text-[#1D2935] flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-2xs"
                  >
                    <Pizza className="w-3.5 h-3.5 text-[#D59B42]" /> Lobby Pizza Pivot
                  </button>
                </div>
              )}

              {!isPollLocked && (
                <div className="bg-[#F8F7F3] border border-[#E9E5DE] rounded-lg p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-[#D59B42] shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[#1D2935] block leading-tight">
                        Vote closes at {formatTime(voteClosingMinutes)}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 block leading-tight mt-0.5">
                        Manager will finalize reservation before tip-off
                      </span>
                    </div>
                  </div>
                  {isPollLockSoon ? (
                    <span className="inline-flex items-center rounded-md bg-[#FFF9EE] border border-[#D59B42]/40 text-[#D59B42] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shrink-0">
                      Locks Soon
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shrink-0">
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
                        className="w-full p-4 rounded-xl border-2 border-emerald-500 bg-white text-left text-xs shadow-sm space-y-3 pointer-events-auto opacity-100"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="pr-2 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                                🎉 TEAM RESERVATION LOCKED
                              </span>
                              {isUserPick && (
                                <span className="inline-flex items-center rounded-md bg-[#FFF9EE] text-[#D59B42] border border-[#D59B42]/40 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                                  Your Vote
                                </span>
                              )}
                            </div>
                            <span className="text-base font-bold tracking-tight block text-[#1D2935]">
                              {option.name}
                            </span>
                            <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                              {option.type} • <span className="font-bold text-[#1D2935]">{option.playerCount}p + {option.parentCount} adults</span>
                            </span>
                          </div>

                          <div className="shrink-0 text-right pl-2">
                            <span className="font-bold px-2.5 py-1 rounded-md text-xs block tabular-nums bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                              {optionSeats} seats confirmed
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-1 uppercase tracking-wider tabular-nums font-bold">
                              {option.votes} votes ({votePercent}%)
                            </span>
                          </div>
                        </div>

                        <div className="h-1.5 w-full bg-[#F8F7F3] border border-[#E9E5DE] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#D59B42] transition-all duration-300"
                            style={{ width: `${votePercent}%` }}
                          />
                        </div>

                        {/* Interactive Post-Lock Headcount RSVP Bar on Winning Card */}
                        <div className="bg-[#F8F7F3] border border-emerald-500/35 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2">
                          {userRsvpSeats > 0 ? (
                            <>
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D2935]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                                Your Party: {userRsvpSeats} Seats Added
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustRsvpSeats(-1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-50 border border-[#E9E5DE] text-[#1D2935] font-bold text-xs active:scale-[0.95] transition-all cursor-pointer"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustRsvpSeats(1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white hover:bg-slate-50 border border-[#E9E5DE] text-[#1D2935] font-bold text-xs active:scale-[0.95] transition-all cursor-pointer"
                                >
                                  +
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsEditingRsvp((prev) => !prev)}
                                  className="px-2 py-1 rounded-md bg-white hover:bg-slate-50 border border-[#E9E5DE] text-[#D59B42] text-[10px] font-bold uppercase cursor-pointer"
                                >
                                  Edit
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-semibold text-[#1D2935]">
                                Joining the winning team table?
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCountUsIn(Math.max(2, userPartyTotal))}
                                className="bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer shadow-2xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Count Us In (+{Math.max(2, userPartyTotal)} Seats)
                              </button>
                            </>
                          )}
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E9E5DE]">
                          <a
                            href={`tel:${option.phone.replace(/[^0-9]/g, "")}`}
                            className="bg-[#1D2935] hover:bg-[#1D2935]/90 text-white font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer"
                          >
                            <PhoneCall className="w-3 h-3 text-[#D59B42]" /> Call Restaurant
                          </a>
                          <a
                            href={getMapsUrl(`${option.name} ${option.address}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-[#F8F7F3] hover:bg-[#E9E5DE]/60 text-[#1D2935] border border-[#E9E5DE] font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer"
                          >
                            <Navigation className="w-3 h-3 text-[#D59B42]" /> Open in Maps
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
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between text-xs transition-all duration-150 ease-out relative ${
                        isPollLocked
                          ? "bg-[#F8F7F3] border-[#E9E5DE] opacity-55 pointer-events-none cursor-default"
                          : isUserPick
                            ? "bg-[#FFF9EE] border-2 border-[#D59B42] shadow-xs cursor-pointer active:scale-[0.98]"
                            : isWinner
                              ? "bg-white border-[#D59B42]/60 shadow-xs cursor-pointer active:scale-[0.98]"
                              : "bg-white border-[#E9E5DE] hover:border-[#D59B42]/45 shadow-2xs cursor-pointer active:scale-[0.98]"
                      }`}
                    >
                      <div className="pr-2 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-bold tracking-tight block text-[#1D2935]">
                            {option.name}
                          </span>
                          {isWinner && !isPollLocked && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#FFF9EE] border border-[#D59B42]/40 text-[#D59B42] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                              <Trophy className="w-2.5 h-2.5" /> Leading
                            </span>
                          )}
                          {isUserPick && (
                            <span className="inline-flex items-center rounded-md bg-white border border-[#D59B42]/50 text-[#1D2935] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                              Your Vote
                            </span>
                          )}
                          {option.isCustom && !isWinner && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#F8F7F3] border border-[#E9E5DE] text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-[#D59B42]" /> Parent Pick
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                          {option.type} • <span className="font-semibold text-[#1D2935]">{option.playerCount}p + {option.parentCount} adults</span>
                        </span>
                        <div className="mt-2 h-1.5 w-full bg-[#F8F7F3] border border-[#E9E5DE]/80 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#D59B42] transition-all duration-300"
                            style={{ width: `${votePercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="shrink-0 text-right pl-2">
                        {isPollLocked ? (
                          <span className="inline-flex items-center gap-1 bg-white text-slate-500 border border-[#E9E5DE] px-2.5 py-1 rounded-md text-[11px] font-semibold">
                            🔒 Closed
                          </span>
                        ) : (
                          <span className={`font-bold px-2.5 py-1 rounded-md text-xs block tabular-nums ${
                            isWinner 
                              ? "bg-[#FDF9F0] text-[#1D2935] border border-[#D59B42]/40" 
                              : isUserPick
                                ? "bg-[#D59B42] text-white"
                                : "bg-[#F8F7F3] text-[#1D2935] border border-[#E9E5DE]"
                          }`}>
                            {option.votes} votes ({optionSeats} seats)
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-500 block mt-1 uppercase tracking-wider tabular-nums">
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
        <section id="section-coffee" className="bg-white rounded-[26px] p-4 shadow-tactile-sm border-[1.5px] border-[#DCE1E7] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#FDF9F0] border border-[#D59B42]/30 text-[#D59B42]">
                <Coffee className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold tracking-tight uppercase text-[#1D2935]">
                  Sideline Fuel
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">Coffee Radar &amp; Parent Pit Stops</span>
              </div>
            </div>
            <span className="inline-flex items-center rounded-md bg-[#F8F7F3] border border-[#E9E5DE] text-[#1D2935] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
              Nearby Gym
            </span>
          </div>

          <div className="space-y-2">
            {coffeeSpots.map((spot, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[#F8F7F3] border border-[#E9E5DE] hover:border-[#D59B42]/40 text-xs transition-colors">
                <div className="pr-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold tracking-tight text-[#1D2935]">{spot.name}</span>
                    <span className="inline-flex items-center rounded bg-white border border-[#E9E5DE] text-slate-600 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5">
                      {spot.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                    {spot.distance} • <span className="text-slate-500">{spot.note}</span>
                  </span>
                </div>
                <a 
                  href={getMapsUrl(spot.name + " " + spot.address)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="shrink-0 bg-[#1D2935] hover:bg-[#1D2935]/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 active:scale-[0.97] transition-all cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#D59B42]" /> Map
                </a>
              </div>
            ))}
          </div>
        </section>

          </div>
        )}

        {(activeTab === "travel" || activeTab === "hotel") && (() => {
          const hotelAlerts = alerts.filter(a => a.gameId === "hotel");
          return (
          <div key="travel" className="space-y-3 animate-in fade-in-50 duration-200 ease-out">
        {/* =========================================================
            ANY-CITY TRAVEL CORRIDOR & HIGHWAY PIT STOPS ENGINE
        ========================================================= */}
        <section id="section-corridor" className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-white border border-[#E9E5DE] text-[#D59B42] shadow-2xs">
                <Car className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-xs font-bold tracking-tight uppercase text-[#1D2935]">
                Travel Corridor &amp; Highway Pit Stops
              </h3>
            </div>
            <span className="inline-flex items-center rounded-md bg-white border border-[#E9E5DE] text-[#1D2935] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 tabular-nums">
              {corridorPlan.stops.length} {corridorPlan.stops.length === 1 ? "Stop" : "Stops"} Mapped
            </span>
          </div>

          <div className="bg-white rounded-[26px] border-[1.5px] border-[#DCE1E7] shadow-tactile-sm p-4 space-y-3.5">
            {/* Inline 2-Way Direction Segmented Control: [ ➔ To Tournament | ↺ Trip Home ] */}
            <div className="grid grid-cols-2 gap-1 bg-[#F8F7F3] border border-[#E9E5DE] p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleSetCorridorDirection("to_tournament")}
                className={`py-1.5 px-3 rounded-md text-xs tracking-tight flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] ${
                  corridorDirection === "to_tournament"
                    ? "bg-[#FDF9F0] text-[#1D2935] font-bold border border-[#D59B42]/35 shadow-2xs"
                    : "text-slate-500 hover:text-[#1D2935] font-medium border border-transparent"
                }`}
              >
                <span>➔ To Tournament</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetCorridorDirection("trip_home")}
                className={`py-1.5 px-3 rounded-md text-xs tracking-tight flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] ${
                  corridorDirection === "trip_home"
                    ? "bg-[#FDF9F0] text-[#1D2935] font-bold border border-[#D59B42]/35 shadow-2xs"
                    : "text-slate-500 hover:text-[#1D2935] font-medium border border-transparent"
                }`}
              >
                <span>↺ Trip Home</span>
              </button>
            </div>

            {/* Route Header & Origin Quick Selector Popover */}
            <div className="relative">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="inline-flex items-center rounded-md bg-[#FFF9EE] border border-[#D59B42]/40 text-[#D59B42] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                    {corridorPlan.highwayRouteSummary}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-[#1D2935] tracking-tight mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span>{corridorPlan.origin}</span>
                    <span className="text-[#D59B42]">➔</span>
                    <span>{corridorPlan.destination}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {corridorDirection === "trip_home" ? "Return Target:" : "Target Base Camp:"}{" "}
                    <span className="text-[#1D2935] font-semibold">{corridorPlan.destinationVenue}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOriginPopoverOpen((prev) => !prev);
                    setIsCustomOriginMode(false);
                  }}
                  aria-expanded={isOriginPopoverOpen}
                  className="shrink-0 bg-[#F8F7F3] hover:bg-[#E9E5DE]/50 text-[#1D2935] border border-[#E9E5DE] px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 active:scale-[0.97] transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#D59B42]" />
                  <span>{corridorDirection === "trip_home" ? "Home City" : "Origin"}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOriginPopoverOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Quick Origin Selector Popover */}
              {isOriginPopoverOpen && (
                <div className="mt-3 bg-[#F8F7F3] border border-[#E9E5DE] rounded-xl p-3 space-y-2.5 shadow-sm animate-in fade-in-50 slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Select Home / Departure Origin (North America)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOriginPopoverOpen(false);
                        setIsCustomOriginMode(false);
                      }}
                      className="text-slate-500 hover:text-[#1D2935] p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {originPresets.map((preset) => {
                      const isCustomOption = preset === "Custom..." || preset === "Custom City / Zip...";
                      const isSelected = isCustomOption
                        ? isCustomOriginMode
                        : !isCustomOriginMode && departureOrigin.toLowerCase() === preset.toLowerCase();
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleSelectOriginPreset(preset)}
                          className={`py-2 px-2.5 rounded-lg text-left text-xs border transition-all cursor-pointer active:scale-[0.98] truncate ${
                            isSelected
                              ? "bg-[#FDF9F0] text-[#1D2935] font-bold border-[#D59B42]"
                              : "bg-white text-[#1D2935] font-medium border-[#E9E5DE] hover:border-[#D59B42]/45"
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
                        placeholder="Enter any North American city or postal/zip code..."
                        autoFocus
                        className="flex-1 bg-white border border-[#E9E5DE] rounded-lg px-2.5 py-1.5 text-xs text-[#1D2935] placeholder:text-slate-400 focus:border-[#D59B42] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-[#1D2935] hover:bg-[#1D2935]/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0"
                      >
                        Set Route
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Telemetry Summary: Drive Duration & Recommended Departure Call */}
            <div className="grid grid-cols-2 gap-2 border-t border-[#E9E5DE] pt-3">
              <div className="bg-[#F8F7F3] border border-[#E9E5DE] rounded-lg p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Est. Drive Time &amp; Distance
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-[#1D2935] tabular-nums">
                    {corridorPlan.durationLabel}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                    ({corridorPlan.distanceKm} km)
                  </span>
                </div>
              </div>

              <div className="bg-[#FFF9EE] border border-[#D59B42]/40 rounded-lg p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D59B42] block">
                  {corridorPlan.recommendedDepartureTitle}
                </span>
                <span className="mt-1 text-sm sm:text-base font-bold text-[#1D2935] block tabular-nums">
                  {corridorPlan.recommendedDepartureLabel}
                </span>
              </div>
            </div>

            <div className="text-xs text-[#1D2935] font-medium bg-[#FDF9F0] border border-[#D59B42]/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#D59B42] shrink-0" />
              <span>{corridorPlan.departureContextNote}</span>
            </div>

            {/* Live Traffic & Weather Disclaimer */}
            <div className="text-[11px] text-slate-500 italic bg-[#F8F7F3] border border-[#E9E5DE] rounded-lg px-3 py-2 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-[#D59B42] shrink-0 mt-0.5" />
              <span>
                Times are standard distance estimates. Check live Maps before departure for real-time traffic and weather delays.
              </span>
            </div>

            {/* Strategic Highway Pit-Stop Waypoint Cards */}
            <div className="space-y-2.5 pt-0.5">
              {corridorPlan.stops.map((stop, idx) => (
                <div
                  key={stop.id}
                  className="bg-[#F1F3F5] border border-[#DCE1E7] rounded-2xl p-3 space-y-2 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-md bg-white border border-[#DCE1E7] text-[#0F2942] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                          Stop #{idx + 1} • {stop.milestoneTag}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-white border border-[#DCE1E7] text-[#5C6B7B] text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5">
                          {stop.elapsedDriveLabel}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold tracking-tight text-[#0F2942] mt-1.5 leading-snug">
                        {stop.title}
                      </h5>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-snug">
                    <span className="text-[#0F2942] text-[11px] uppercase tracking-wider font-bold mr-1">
                      Athlete Fuel &amp; Coffee:
                    </span>
                    {stop.fuelAndCoffeeOptions}
                  </p>

                  <a
                    href={stop.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 min-h-[44px] flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#0F2942] text-white text-xs font-bold hover:bg-[#1A365D] transition-colors shadow-xs"
                  >
                    <svg aria-hidden="true" className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>Open Directions in Google Maps</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hotel Base Camp */}
        <section id="section-hotel" className="bg-white rounded-[26px] p-4 shadow-tactile-sm border-[1.5px] border-[#DCE1E7] space-y-3">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F1F3F5] text-[#5C6B7B] text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5">
              <Hotel className="w-3 h-3 text-[#0F2942]" aria-hidden="true" /> Team Hotel Base Camp
            </span>
            <h2 className="text-lg font-extrabold text-[#0F2942] tracking-tight mt-1.5 leading-snug">
              {tournament.hotel.name}
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-0.5 flex items-center gap-1">
              <svg aria-hidden="true" className="w-3.5 h-3.5 text-[#0F2942] fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span className="truncate">{tournament.hotel.address}</span>
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${tournament.hotel.name}, ${tournament.hotel.address}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 min-h-[44px] flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#0F2942] text-white text-xs font-bold hover:bg-[#1A365D] transition-colors shadow-xs"
            >
              <svg aria-hidden="true" className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>Open Directions in Google Maps</span>
            </a>
          </div>

          <div className="bg-[#F1F3F5] border border-[#DCE1E7] rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-[#5C6B7B] text-[10px] font-bold uppercase tracking-wider">Team Room Block Rate</span>
            <span className="font-bold text-[#0F2942] text-xs">{tournament.hotel.rate}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-[#DCE1E7] pt-3">
            <div className="bg-[#F1F3F5] p-2.5 rounded-xl border border-[#DCE1E7]">
              <span className="text-[#5C6B7B] font-bold block text-[10px] uppercase tracking-wider">Breakfast</span>
              <span className="font-bold text-[#0F2942] text-xs sm:text-sm mt-0.5 block">{tournament.hotel.breakfastHours}</span>
            </div>
            <div className="bg-[#F1F3F5] p-2.5 rounded-xl border border-[#DCE1E7]">
              <span className="text-[#5C6B7B] font-bold block text-[10px] uppercase tracking-wider">Checkout</span>
              <span className="font-bold text-[#0F2942] text-xs sm:text-sm mt-0.5 block">{tournament.hotel.checkoutTime}</span>
            </div>
          </div>

          {/* Hub Tips Collapsible Accordion */}
          <div className="border-t border-[#DCE1E7] pt-3">
            <button
              type="button"
              onClick={() => setOpenTipsGameId(openTipsGameId === "hotel" ? null : "hotel")}
              aria-expanded={openTipsGameId === "hotel"}
              className="w-full flex items-center justify-between gap-2 active:scale-[0.99] transition-transform duration-100 ease-out cursor-pointer"
            >
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#0F2942] flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-[#0F2942]" aria-hidden="true" /> HUB TIPS
                <span className="bg-[#E2E8F0] text-[#0F2942] font-black text-xs px-2 py-0.5 rounded-full tabular-nums leading-none">
                  {hotelAlerts.length}
                </span>
              </span>
              <ChevronDown className={`w-4 h-4 text-[#5C6B7B] transition-transform duration-200 ${openTipsGameId === "hotel" ? "rotate-180" : ""}`} />
            </button>

            {openTipsGameId === "hotel" && (
              <div className="mt-3 space-y-2 animate-in fade-in-50 slide-in-from-top-1 duration-200 ease-out">
                {hotelAlerts.length === 0 ? (
                  <p className="text-[11px] text-slate-500 font-medium italic">No hotel tips posted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {hotelAlerts.map(alert => (
                      <div key={alert.id} className="bg-[#F8F7F3] border border-[#E9E5DE] rounded-lg p-2.5 space-y-1.5">
                        <div>
                          <h4 className="text-xs font-bold tracking-tight text-[#1D2935]">{alert.title}</h4>
                          <p className="text-xs text-slate-600 leading-snug mt-0.5">{alert.content}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-[#E9E5DE] pt-1.5 text-[11px] text-slate-500">
                          <span>By {alert.author}</span>
                          <button
                            type="button"
                            onClick={() => upvoteAlert(alert.id)}
                            className="inline-flex items-center gap-1 font-semibold text-[11px] bg-white border border-[#E9E5DE] hover:border-[#D59B42]/45 text-[#1D2935] px-2 py-0.5 rounded-md active:scale-[0.97] transition-all cursor-pointer"
                          >
                            <ThumbsUp className="w-3 h-3 text-[#D59B42]" /> Helpful ({alert.upvotes})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setActiveModalGameId("hotel")}
                  className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-[#1D2935] bg-[#FDF9F0] hover:bg-[#FAF4E5] px-2.5 py-2 rounded-lg border border-[#D59B42]/35 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D59B42]" /> Add Tip
                </button>
              </div>
            )}
          </div>
        </section>

          </div>
          );
        })()}
      </main>

      {/* Light editorial bottom navigation bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E9E5DE] shadow-sm pb-[env(safe-area-inset-bottom)]">
        <nav
          aria-label="Primary tournament navigation"
          className="mx-auto w-full max-w-md px-4 py-2 grid grid-cols-3 gap-2 items-center"
        >
          {([
            { id: "schedule", label: "Schedule", Icon: CalendarDays },
            { id: "fuel", label: "Fuel", Icon: Utensils },
            { id: "travel", label: "Travel", Icon: Car },
          ] as const).map(({ id, label, Icon }) => {
            const isTabActive = id === "travel" ? (activeTab === "travel" || activeTab === "hotel") : activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={isTabActive ? "page" : undefined}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-3 text-xs tracking-tight active:scale-[0.97] transition-all duration-150 cursor-pointer ${
                  isTabActive
                    ? "text-[#1D2935] font-bold bg-[#FDF9F0] border border-[#D59B42]/30 shadow-2xs"
                    : "text-slate-500 hover:text-[#1D2935] font-medium border border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isTabActive ? "text-[#D59B42] stroke-[2.25]" : "text-current stroke-[1.9]"
                  }`}
                />
                <span>{label}</span>
              </button>
            );
          })}
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
