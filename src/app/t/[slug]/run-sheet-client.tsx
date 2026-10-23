"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
  Pencil
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
type JerseyColor = "Dark / Away" | "Light / Home";

interface Game {
  id: string;
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
  const slug = (params?.slug as string) || "test-team";
  const isAdmin = searchParams.get("admin") === "true";

  const tournament = {
    name: "Capital Classic Invitational",
    leagueName: "Ontario Basketball Association (OBL)",
    teamName: "Ottawa Elite U16 Boys",
    city: "Ottawa, ON",
    primaryHub: "Carleton Ravens Nest",
    primaryHubAddress: "1125 Colonel By Dr, Ottawa, ON",
    lastUpdatedText: "Updated 4 mins ago by Coach Mark",
    hotel: {
      name: "Brookstreet Hotel",
      address: "525 Legget Dr, Kanata, ON",
      breakfastHours: "6:30 AM - 10:00 AM",
      checkoutTime: "11:00 AM"
    }
  };

  const coffeeSpots = [
    {
      name: "Happy Goat Coffee Co.",
      distance: "4 min drive (1.2 km)",
      type: "Sit Down & Wi-Fi",
      note: "Great pour-over bar, plenty of tables",
      address: "Ottawa, ON"
    },
    {
      name: "Tim Hortons / Drive-Thru",
      distance: "2 min drive (0.7 km)",
      type: "Drive-Thru",
      note: "Fast line, mobile app orders ready quick",
      address: "Ottawa, ON"
    },
    {
      name: "Equator Coffee Roasters",
      distance: "6 min drive (2.4 km)",
      type: "Specialty / Fast",
      note: "Excellent espresso & quick breakfast sandwiches",
      address: "Ottawa, ON"
    }
  ];

  const quickLunchSpots = [
    {
      name: "Freshii (Bank St)",
      type: "Smoothies & Bowls",
      distance: "4 min drive (1.5 km)",
      note: "Fast wraps, protein bowls, energizing smoothies. Order ahead on app.",
      address: "Ottawa, ON"
    },
    {
      name: "Firehouse Subs",
      type: "Hot & Cold Subs",
      distance: "6 min drive (2.8 km)",
      note: "Quick hearty subs, large seating area if parents want to sit.",
      address: "Ottawa, ON"
    },
    {
      name: "Farm Boy Hot Bar & Deli",
      type: "Deli Wraps & Salad Bar",
      distance: "5 min drive (2.0 km)",
      note: "Ready-to-eat wraps, fruit cups, clean seating area inside.",
      address: "Ottawa, ON"
    },
    {
      name: "Booster Juice",
      type: "Smoothies & Paninis",
      distance: "5 min drive (2.1 km)",
      note: "Quick athlete fuel between games. Light and easy on the stomach.",
      address: "Ottawa, ON"
    }
  ];

  const [games, setGames] = useState<Game[]>([
    {
      id: "g1",
      opponent: "Montreal Northern Stars",
      tipOffMinutes: 615, // 10:15 AM
      court: "Court 1",
      venueName: "Carleton Ravens Nest",
      venueAddress: "1125 Colonel By Dr",
      city: "Ottawa, ON",
      warmupBufferMin: 30,
      hotelTravelMin: 25,
      status: "Upcoming",
      jerseyColor: "Dark / Away"
    },
    {
      id: "g2",
      opponent: "Kingston Impact",
      tipOffMinutes: 885, // 2:45 PM
      court: "Court 3",
      venueName: "Carleton Ravens Nest",
      venueAddress: "1125 Colonel By Dr",
      city: "Ottawa, ON",
      warmupBufferMin: 30,
      hotelTravelMin: 25,
      status: "Upcoming",
      jerseyColor: "Light / Home"
    }
  ]);

  const [alerts, setAlerts] = useState<VenueAlert[]>([
    {
      id: "a1",
      gameId: "g1",
      type: "gate",
      title: "Gate Admission",
      content: "$10/day adult admission. Cash or e-Transfer only at the door.",
      author: "Coach Mark",
      upvotes: 4
    },
    {
      id: "a2",
      gameId: "g1",
      type: "parking",
      title: "Parking Alert",
      content: "Lot P5 fills fast. Overflow is available in Lot P18 across campus.",
      author: "Sarah (#11 Mom)",
      upvotes: 7
    },
    {
      id: "h1",
      gameId: "hotel",
      type: "note",
      title: "Ice Machines & Water Fill",
      content: "High-capacity ice machines are on floors 2 & 4 near the North elevators. Filtered bottle station in the fitness lobby.",
      author: "Coach Mark",
      upvotes: 6
    },
    {
      id: "h2",
      gameId: "hotel",
      type: "parking",
      title: "Bus & Oversized SUV Parking",
      content: "Use the North surface lot for team vans and roof boxes — underground parkade clearance is 6'4\".",
      author: "Dave (#14 Dad)",
      upvotes: 5
    },
    {
      id: "h3",
      gameId: "hotel",
      type: "concessions",
      title: "Early Grab-and-Go Breakfast",
      content: "Front desk puts out fruit, yogurt & bagel bags at 6:00 AM for early tip-off groups.",
      author: "Kelly (#7 Mom)",
      upvotes: 8
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
  const [userVotedId, setUserVotedId] = useState<string | null>("p3");
  const [userParty, setUserParty] = useState({ players: 1, parents: 1 });
  const [userFinalAttendance, setUserFinalAttendance] = useState<"attending" | "declined" | null>(null);

  // Manual test override for Lunch vs. Dinner
  const [manualMealMode, setManualMealMode] = useState<"lunch" | "dinner" | "auto">("auto");

  // Manager Suite State: Quick-Edit Game Drawer & Schedule Ingestion Modal
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editTipOffTime, setEditTipOffTime] = useState("10:15");
  const [editCourtLocation, setEditCourtLocation] = useState("");
  const [editOpponent, setEditOpponent] = useState("");
  const [editStatus, setEditStatus] = useState<GameStatus>("Upcoming");
  const [editJerseyColor, setEditJerseyColor] = useState<JerseyColor>("Dark / Away");

  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [ingestRawText, setIngestRawText] = useState("");
  const [parsedPreviewGames, setParsedPreviewGames] = useState<Game[] | null>(null);

  // Real-time synchronization for Meal Mode & Games via Supabase Realtime + Broadcast fallback
  useEffect(() => {
    if (!slug) return;

    const storageMealKey = `awayday_meal_mode_${slug}`;
    const storageGamesKey = `awayday_games_${slug}`;

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
      .channel(`team_trips_meal_mode_${slug}`, {
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
        if (payload?.mealType === "lunch" || payload?.mealType === "dinner") {
          setManualMealMode(payload.mealType);
        }
      })
      .on("broadcast", { event: "games_sync" }, ({ payload }: any) => {
        if (Array.isArray(payload?.games)) {
          setGames(payload.games);
        }
      })
      .subscribe();

    // 3. Browser BroadcastChannel + storage listener for instant cross-tab sync
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel(`awayday_sync_${slug}`);
      bc.onmessage = (ev) => {
        if (ev.data?.type === "meal_mode_sync" && ev.data.mealType) {
          setManualMealMode(ev.data.mealType);
        }
        if (ev.data?.type === "games_sync" && Array.isArray(ev.data.games)) {
          setGames(ev.data.games);
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
    };
    window.addEventListener("storage", handleStorage);

    // 4. Clean up subscriptions on component unmount
    return () => {
      supabase.removeChannel(channel);
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [slug]);

  const [options, setOptions] = useState<MealOption[]>([
    { 
      id: "p1", 
      name: "Farm Boy Hot Bar & Seating", 
      type: "Fast / Healthy", 
      totalSeats: 12,
      playerCount: 7, 
      parentCount: 5, 
      votes: 7,
      phone: "(613) 247-1000",
      address: "193 Metcalfe St, Ottawa, ON"
    },
    { 
      id: "p2", 
      name: "Shawarma Palace (Bank St)", 
      type: "Casual / Fast", 
      totalSeats: 19,
      playerCount: 11, 
      parentCount: 8, 
      votes: 11,
      phone: "(613) 736-7776",
      address: "2440 Bank St, Ottawa, ON"
    },
    { 
      id: "p3", 
      name: "Montanas BBQ", 
      type: "Sit Down", 
      totalSeats: 6,
      playerCount: 3, 
      parentCount: 3, 
      votes: 3,
      phone: "(613) 737-0200",
      address: "2210 Bank St, Ottawa, ON"
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

  const broadcastGamesSync = async (updatedGames: Game[]) => {
    try {
      window.localStorage.setItem(`awayday_games_${slug}`, JSON.stringify(updatedGames));
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel(`awayday_sync_${slug}`);
        bc.postMessage({ type: "games_sync", games: updatedGames });
        bc.close();
      }
      const ch = supabase.channel(`team_trips_meal_mode_${slug}`);
      await ch.send({
        type: "broadcast",
        event: "games_sync",
        payload: { games: updatedGames }
      });
    } catch (err) {
      console.error("Failed to broadcast games update:", err);
    }
  };

  const openEditDrawer = (game: Game) => {
    setEditingGame(game);
    setEditTipOffTime(minutesToTimeInput(game.tipOffMinutes));
    setEditCourtLocation(`${game.court} • ${game.venueName}`);
    setEditOpponent(game.opponent);
    setEditStatus(game.status || "Upcoming");
    setEditJerseyColor(game.jerseyColor || "Dark / Away");
  };

  const handleSaveGameEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;

    const parts = editCourtLocation.split("•").map(s => s.trim());
    const nextCourt = parts[0] || editingGame.court;
    const nextVenue = parts[1] || editingGame.venueName;
    const nextTipOff = timeInputToMinutes(editTipOffTime);

    const updatedGames = games.map(g => {
      if (g.id !== editingGame.id) return g;
      return {
        ...g,
        tipOffMinutes: nextTipOff,
        court: nextCourt,
        venueName: nextVenue,
        opponent: editOpponent.trim() || g.opponent,
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

  const handleApplyIngestedSchedule = async () => {
    if (!parsedPreviewGames || parsedPreviewGames.length === 0) return;
    setGames(parsedPreviewGames);
    await broadcastGamesSync(parsedPreviewGames);
    setParsedPreviewGames(null);
    setIngestRawText("");
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

  const handleSelectOption = (optionId: string) => {
    if (isVoteLocked) return;
    const total = userParty.players + userParty.parents;

    if (userVotedId === optionId) {
      setOptions(prev => prev.map(opt => {
        if (opt.id !== optionId) return opt;
        return {
          ...opt,
          votes: Math.max(0, opt.votes - 1),
          totalSeats: Math.max(0, opt.totalSeats - total),
          playerCount: Math.max(0, opt.playerCount - userParty.players),
          parentCount: Math.max(0, opt.parentCount - userParty.parents)
        };
      }));
      setUserVotedId(null);
    } else {
      setOptions(prev => prev.map(opt => {
        if (opt.id === userVotedId) {
          return {
            ...opt,
            votes: Math.max(0, opt.votes - 1),
            totalSeats: Math.max(0, opt.totalSeats - total),
            playerCount: Math.max(0, opt.playerCount - userParty.players),
            parentCount: Math.max(0, opt.parentCount - userParty.parents)
          };
        }
        if (opt.id === optionId) {
          return {
            ...opt,
            votes: opt.votes + 1,
            totalSeats: opt.totalSeats + total,
            playerCount: opt.playerCount + userParty.players,
            parentCount: opt.parentCount + userParty.parents
          };
        }
        return opt;
      }));
      setUserVotedId(optionId);
    }
  };

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
      phone: suggestPhone.trim() || "(613) 555-0100",
      address: "Ottawa, ON",
      isCustom: true,
      suggestedBy: suggestAuthor.trim() || "Parent"
    };

    setOptions(prev => {
      const cleaned = prev.map(opt => {
        if (opt.id === userVotedId) {
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
      return [...cleaned, newOption];
    });

    setUserVotedId(newId);
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
        name: "🍕 Gabriel Pizza (Delivered to Lobby)",
        type: "Hotel Lobby Delivery",
        totalSeats: userTotal,
        playerCount: userParty.players,
        parentCount: userParty.parents,
        votes: 1,
        phone: "(613) 592-7777",
        address: tournament.hotel.address,
        isCustom: true,
        isDelivery: true,
        suggestedBy: "Quick Pivot"
      };

      setOptions(prev => {
        const cleaned = prev.map(opt => {
          if (opt.id === userVotedId) {
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
        return [...cleaned, pizzaOption];
      });
      setUserVotedId(pizzaId);
    } else {
      handleSelectOption(pizzaId);
    }
  };

  const updatePartyCounts = (playersDelta: number, parentsDelta: number) => {
    const nextPlayers = Math.max(1, userParty.players + playersDelta);
    const nextParents = Math.max(0, userParty.parents + parentsDelta);
    const diffPlayers = nextPlayers - userParty.players;
    const diffParents = nextParents - userParty.parents;
    const diffTotal = diffPlayers + diffParents;

    setUserParty({ players: nextPlayers, parents: nextParents });

    if (userVotedId && !isVoteLocked) {
      setOptions(prev => prev.map(opt => {
        if (opt.id !== userVotedId) return opt;
        return {
          ...opt,
          totalSeats: Math.max(0, opt.totalSeats + diffTotal),
          playerCount: Math.max(0, opt.playerCount + diffPlayers),
          parentCount: Math.max(0, opt.parentCount + diffParents)
        };
      }));
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

  const highestSeats = Math.max(...options.map(o => o.totalSeats));
  const winningOption = options.find(o => o.totalSeats === highestSeats && highestSeats > 0);

  const isVoterOfWinner = winningOption && userVotedId === winningOption.id;
  const isJoiningWinner = userFinalAttendance === "attending";
  const userPartyTotal = userParty.players + userParty.parents;

  const confirmedReservationSeats = winningOption 
    ? winningOption.totalSeats + (!isVoterOfWinner && isJoiningWinner ? userPartyTotal : 0)
    : 0;
  
  const confirmedPlayers = winningOption 
    ? winningOption.playerCount + (!isVoterOfWinner && isJoiningWinner ? userParty.players : 0)
    : 0;

  const confirmedParents = winningOption 
    ? winningOption.parentCount + (!isVoterOfWinner && isJoiningWinner ? userParty.parents : 0)
    : 0;

  const estimatedPizzas = Math.ceil(confirmedReservationSeats / 2.5);

  // Time calculations
  const game1EndMinutes = games[0].tipOffMinutes + 75; // ~11:30 AM
  const game2WarmupMinutes = games[1].tipOffMinutes - games[1].warmupBufferMin; // ~2:15 PM
  const game2EndMinutes = games[1].tipOffMinutes + 75; // ~4:00 PM

  // Evening block reference: 7:30 PM (1170 mins) wind-down / hotel return
  const eveningEndMinutes = 1170;

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
  const voteClosingMinutes = isLunch ? (game1EndMinutes - 30) : (games[1].tipOffMinutes - 30);

  const handleSetMealMode = async (nextMode: "lunch" | "dinner") => {
    setManualMealMode(nextMode);

    // 1. Sync to localStorage & BroadcastChannel immediately for instant cross-tab reactivity
    try {
      window.localStorage.setItem(`awayday_meal_mode_${slug}`, nextMode);
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel(`awayday_sync_${slug}`);
        bc.postMessage({ type: "meal_mode_sync", mealType: nextMode });
        bc.close();
      }
    } catch {
      // Ignore local storage errors
    }

    // 2. Broadcast over Supabase Realtime channel + persist to team_trips table
    try {
      const ch = supabase.channel(`team_trips_meal_mode_${slug}`);
      await ch.send({
        type: "broadcast",
        event: "meal_mode_sync",
        payload: { mealType: nextMode }
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
          <span className="text-[11px] text-amber-400 font-extrabold shrink-0">Sat, Oct 3</span>
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
              <button
                type="button"
                onClick={() => {
                  setParsedPreviewGames(null);
                  setIsIngestModalOpen(true);
                }}
                className="bg-[#111827] hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-mono px-3 py-1 rounded-lg transition-all cursor-pointer active:scale-[0.96]"
              >
                + Ingest Schedule
              </button>
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
                  <MapPin className="w-3 h-3 text-amber-400" /> {tournament.city}
                </span>
                <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                  <Shield className="w-2.5 h-2.5 text-slate-300" /> {tournament.leagueName}
                </span>
              </div>

              <h2 className="text-lg font-black text-white tracking-tight pt-0.5">
                {tournament.name}
              </h2>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium pt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Primary Hub: <strong className="text-white font-black">{tournament.primaryHub}</strong></span>
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

        {/* Hero: Next Tip-Off */}
        {(() => {
          const nextGame = [...games].sort((a, b) => a.tipOffMinutes - b.tipOffMinutes)[0];
          if (!nextGame) return null;
          const nextDepart = nextGame.tipOffMinutes - nextGame.warmupBufferMin - nextGame.hotelTravelMin;
          return (
            <section className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#182235] to-[#111827] border border-amber-500/40 text-white shadow-2xl">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/15 blur-3xl" />
              <div className="relative flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                  Next Tip-Off
                </span>
                <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none shrink-0">
                  {nextGame.court}
                </span>
              </div>
              <div className="relative mt-3 tabular-nums font-mono text-6xl font-black tracking-tighter leading-none text-amber-400">
                {formatTime(nextGame.tipOffMinutes)}
              </div>
              <h2 className="relative mt-2 text-xl font-black tracking-tight truncate text-white">vs. {nextGame.opponent}</h2>
              <div className="relative mt-4 flex items-center justify-between gap-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Leave hotel <span className="font-mono text-sm font-black tabular-nums text-white">{formatTime(nextDepart)}</span>
                </div>
                <a
                  href={getMapsUrl(`${nextGame.venueName} ${nextGame.venueAddress} ${nextGame.city}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-lg shadow-black/40"
                >
                  <Navigation className="w-3.5 h-3.5 text-slate-950" /> Navigate
                </a>
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
            const departMinutes = game.tipOffMinutes - game.warmupBufferMin - game.hotelTravelMin;
            const arrivalMinutes = game.tipOffMinutes - game.warmupBufferMin;
            const gameAlerts = alerts.filter(a => a.gameId === game.id);

            return (
              <div key={game.id} className="bg-[#111827] border border-slate-800/90 shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-5 pb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-slate-400 font-mono text-xs uppercase tracking-wider">Game {index + 1}</span>
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
                    <h3 className="text-xl font-black text-white tracking-tight truncate">vs. {game.opponent}</h3>
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
                      <span className="block text-[10px] text-slate-400 font-medium">warmup</span>
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
            );
          })}
        </section>

          </div>
        )}

        {activeTab === "fuel" && (
          <div key="fuel" className="space-y-4 animate-in fade-in-50 duration-200 ease-out">
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  {isVoteLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Timer className="w-3.5 h-3.5 text-amber-400" />}
                  {isVoteLocked ? "Confirmed Team Dinner Reservation" : "Team Dinner Reservation Poll"}
                </span>
                <span className={`inline-flex items-center gap-1 border-l-2 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none ${
                  isVoteLocked ? "border-l-amber-400 bg-amber-400/10 text-amber-300" : "border-l-slate-400 bg-slate-800 text-slate-300"
                }`}>
                  {isVoteLocked ? "Poll Closed" : "Tap to vote"}
                </span>
              </div>

              {winningOption && (
                <div className="bg-slate-950 text-white rounded-xl p-4 shadow-sm border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5">
                      {winningOption.isDelivery ? <Pizza className="w-3.5 h-3.5 text-amber-400" /> : <Users className="w-3.5 h-3.5 text-amber-400" />}
                      {winningOption.isDelivery ? "Lobby Delivery Target" : "Final Reservation Target"}
                    </span>
                    <span className="inline-flex items-center gap-1 border-l-2 border-l-emerald-400 bg-emerald-400/10 text-emerald-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                      {confirmedReservationSeats} Total Seats
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                    <span className="text-sm font-black text-white truncate max-w-[190px]">{winningOption.name}</span>
                    <span className="text-[11px] font-medium text-slate-300">
                      {confirmedPlayers} Players • {confirmedParents} Parents
                    </span>
                  </div>

                  {winningOption.isDelivery && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded-lg p-2.5 flex items-center justify-between font-medium">
                      <span>Target Order: <strong className="text-white font-black">~{estimatedPizzas} Large Pizzas</strong></span>
                      <span className="text-[10px] text-slate-400 font-mono">1 pie per 2.5 people</span>
                    </div>
                  )}

                  {isVoteLocked && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-300 flex items-center gap-1.5 font-medium">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> {winningOption.phone}
                      </span>
                      <a 
                        href={`tel:${winningOption.phone.replace(/[^0-9]/g, "")}`}
                        className="text-[11px] font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-xl flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-xs"
                      >
                        {winningOption.isDelivery ? "Call Pizza Order" : "Call to Reserve"}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {isVoteLocked && winningOption && !isVoterOfWinner && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 space-y-2.5 animate-in fade-in duration-200">
                  <div>
                    <span className="text-xs font-black text-white block">
                      {winningOption.name} won the vote!
                    </span>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-snug">
                      You previously picked {options.find(o => o.id === userVotedId)?.name || "another spot"}. Are you joining the team table?
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

              {isVoteLocked && winningOption && isVoterOfWinner && (
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

              {!isVoteLocked && (
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

              {!isVoteLocked && (
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

              {!isVoteLocked && (
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
                  <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none shrink-0">
                    Locks Soon
                  </span>
                </div>
              )}

              <div className="space-y-2.5 pt-0.5">
                {options.map(option => {
                  const isWinner = winningOption?.id === option.id;
                  const isUserPick = userVotedId === option.id;

                  return (
                    <button
                      key={option.id}
                      disabled={isVoteLocked}
                      onClick={() => handleSelectOption(option.id)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between text-xs transition-transform duration-100 ease-out cursor-pointer relative active:scale-[0.96] shadow-2xs ${
                        isVoteLocked 
                          ? (isWinner 
                              ? "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/50" 
                              : "bg-slate-900/40 border-slate-800 opacity-60")
                          : (isWinner 
                              ? "bg-slate-900 border-amber-400/60 ring-2 ring-amber-400/30 shadow-md" 
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700")
                      }`}
                    >
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black block text-white">
                            {option.name}
                          </span>
                          {isWinner && (
                            <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-400 bg-amber-400/10 text-amber-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                              <Trophy className="w-2.5 h-2.5" /> {isVoteLocked ? "Selected Choice" : "Leading"}
                            </span>
                          )}
                          {option.isCustom && !isWinner && (
                            <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default select-none pointer-events-none">
                              <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Parent Pick
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-300 block mt-0.5 font-medium">
                          {option.type} • <span className="font-bold text-white">{option.playerCount}p + {option.parentCount} adults</span> {isUserPick && "• (Your vote)"}
                        </span>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`font-black px-3 py-1 rounded-lg text-xs block tabular-nums shadow-2xs ${
                          isWinner 
                            ? "bg-emerald-500 text-slate-950" 
                            : "bg-slate-800 text-slate-200 border border-slate-700"
                        }`}>
                          {option.totalSeats} seats
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5 uppercase tracking-wider">
                          {option.votes} votes
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
                  Jersey Color
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Dark / Away", "Light / Home"] as JerseyColor[]).map((jersey) => (
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
            className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                  MANAGER SUITE
                </span>
                <h3 className="text-base font-black text-white mt-1.5">
                  Ingest Tournament Schedule
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

            {parsedPreviewGames && parsedPreviewGames.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2 max-h-44 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                    Parsed Preview ({parsedPreviewGames.length} Games)
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyIngestedSchedule}
                    className="text-[11px] font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    Apply to Run-Sheet
                  </button>
                </div>
                {parsedPreviewGames.map((g) => (
                  <div key={g.id} className="text-xs border-t border-slate-800 pt-1.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-amber-300 font-bold">{formatTime(g.tipOffMinutes)}</span>
                      <span className="text-white font-bold ml-2">vs {g.opponent}</span>
                      <span className="block text-[11px] text-slate-400 font-mono">{g.venueName} — {g.court}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{g.status || "Upcoming"}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsIngestModalOpen(false);
                  setParsedPreviewGames(null);
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleParseSchedule}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                Parse & Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RunSheetContent;
