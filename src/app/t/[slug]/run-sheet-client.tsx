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
  ChevronDown
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
      hotelTravelMin: 25
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
      hotelTravelMin: 25
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

  // Real-time synchronization for Meal Mode via Supabase Realtime
  useEffect(() => {
    if (!slug) return;

    // 1. Initial data fetch
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

    // 2. Realtime channel subscription listening to postgres_changes
    const channel = supabase
      .channel(`team_trips_meal_mode_${slug}`)
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
      .subscribe();

    // 3. Clean up channel subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
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
    setGames(prev => prev.map(g => {
      if (g.id !== gameId) return g;
      return { ...g, tipOffMinutes: g.tipOffMinutes + deltaMinutes };
    }));
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

  const handleToggleMealMode = async () => {
    const nextMode = isLunch ? "dinner" : "lunch";
    setManualMealMode(nextMode);

    try {
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

  return (
    <div
      style={{ color: '#0f172a' }}
      className="stadium-canvas w-full pb-32"
    >
      {/* Sticky App Header */}
      <header className="sticky top-0 z-30 pt-[max(1rem,env(safe-area-inset-top))] bg-white/90 text-slate-900 border-b border-slate-200/90 shadow-sm shadow-slate-200/50 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-600">AwayDay Run-Sheet</span>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-600 bg-amber-50 text-amber-900 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none shrink-0">
                  Manager Mode
                </span>
              )}
            </div>
            <h1 className="text-lg font-extrabold leading-tight text-slate-900 truncate tracking-tight">{tournament.teamName}</h1>
          </div>

          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-2 border-l-2 border-l-emerald-600 bg-emerald-50 text-emerald-900 font-mono text-xs uppercase tracking-wider px-2.5 py-1 rounded-r cursor-default pointer-events-none select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              Live Sync
            </span>
          </div>
        </div>

        {/* Centered Freshness & Date Micro-bar */}
        <div className="bg-slate-50/95 border-t border-slate-200/80 px-4 py-1.5 flex items-center justify-center gap-2 text-[11px] text-center">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium truncate">
            <Radio className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{tournament.lastUpdatedText}</span>
          </div>
          <span className="text-slate-300 font-bold">•</span>
          <span className="text-[11px] text-amber-700 font-extrabold shrink-0">Sat, Oct 3</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-3.5 space-y-4">
        
        {activeTab === "schedule" && (
          <div key="schedule" className="space-y-4 animate-in fade-in-50 duration-200 ease-out">
        {/* Executive Trip Anchor Banner */}
        <section className="bg-white text-slate-900 rounded-3xl p-5 border border-slate-200/90 shadow-sm shadow-slate-200/50 hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 pr-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-100 text-slate-800 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                  <MapPin className="w-3 h-3 text-amber-600" /> {tournament.city}
                </span>
                <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-100 text-slate-800 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                  <Shield className="w-2.5 h-2.5 text-slate-600" /> {tournament.leagueName}
                </span>
              </div>

              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight pt-0.5">
                {tournament.name}
              </h2>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium pt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Primary Hub: <strong className="text-slate-900 font-extrabold">{tournament.primaryHub}</strong></span>
              </div>
            </div>

            <a 
              href={getMapsUrl(tournament.primaryHubAddress)} 
              target="_blank" 
              rel="noreferrer"
              className="shrink-0 text-xs flex items-center gap-1.5 font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 px-3 py-2 rounded-xl active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-2xs"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-600" /> Hub
            </a>
          </div>
        </section>

        {/* Hero: Next Tip-Off */}
        {(() => {
          const nextGame = [...games].sort((a, b) => a.tipOffMinutes - b.tipOffMinutes)[0];
          if (!nextGame) return null;
          const nextDepart = nextGame.tipOffMinutes - nextGame.warmupBufferMin - nextGame.hotelTravelMin;
          return (
            <section className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 border-0">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
              <div className="relative flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-950 bg-slate-950/25 text-white font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                  Next Tip-Off
                </span>
                <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-950 bg-slate-950/25 text-white font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none shrink-0">
                  {nextGame.court}
                </span>
              </div>
              <div className="relative mt-3 tabular-nums font-mono text-6xl font-black tracking-tighter leading-none text-white">
                {formatTime(nextGame.tipOffMinutes)}
              </div>
              <h2 className="relative mt-2 text-xl font-extrabold tracking-tight truncate text-white">vs. {nextGame.opponent}</h2>
              <div className="relative mt-4 flex items-center justify-between gap-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/95">
                  Leave hotel <span className="font-mono text-sm font-black tabular-nums text-white">{formatTime(nextDepart)}</span>
                </div>
                <a
                  href={getMapsUrl(`${nextGame.venueName} ${nextGame.venueAddress} ${nextGame.city}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 bg-slate-950 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-md"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-400" /> Navigate
                </a>
              </div>
            </section>
          );
        })()}

        {/* Weekend Run-Sheet */}
        <section id="section-games" className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-white border border-slate-200 text-amber-600 shadow-2xs">
                <CalendarDays className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Weekend Run-Sheet</h3>
            </div>
            <span className="text-slate-500 font-mono text-xs uppercase tracking-wider">{games.length} Games Scheduled</span>
          </div>

          {games.map((game, index) => {
            const departMinutes = game.tipOffMinutes - game.warmupBufferMin - game.hotelTravelMin;
            const arrivalMinutes = game.tipOffMinutes - game.warmupBufferMin;
            const gameAlerts = alerts.filter(a => a.gameId === game.id);

            return (
              <div key={game.id} className="bg-white border border-slate-200/90 shadow-sm shadow-slate-200/50 hover:border-slate-300 transition-colors rounded-3xl overflow-hidden">
                <div className="p-5 pb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-slate-500 font-mono text-xs uppercase tracking-wider block">Game {index + 1}</span>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight truncate">vs. {game.opponent}</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-100 text-slate-800 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none shrink-0">
                    {game.court}
                  </span>
                </div>

                {/* Perforated ticket divider */}
                <div className="relative h-px mx-5 border-t border-dashed border-slate-200">
                  <span className="absolute -left-8 -top-2.5 h-5 w-5 rounded-full bg-[#f8fafc] border border-slate-200/90" />
                  <span className="absolute -right-8 -top-2.5 h-5 w-5 rounded-full bg-[#f8fafc] border border-slate-200/90" />
                </div>

                <div className="p-5 pt-4 space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-2 py-3 text-center">
                      <span className="block tabular-nums font-mono text-xl font-extrabold text-slate-900">{formatTime(departMinutes)}</span>
                      <span className="block mt-1 text-slate-500 font-mono text-xs uppercase tracking-wider">Depart</span>
                      <span className="block text-[10px] text-slate-600 font-medium">{game.hotelTravelMin}m drive</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl px-2 py-3 text-center">
                      <span className="block tabular-nums font-mono text-xl font-extrabold text-slate-900">{formatTime(arrivalMinutes)}</span>
                      <span className="block mt-1 text-slate-500 font-mono text-xs uppercase tracking-wider">Gym Arrival</span>
                      <span className="block text-[10px] text-slate-600 font-medium">warmup</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-2 py-3 text-center">
                      <span className="block tabular-nums font-mono text-xl font-extrabold text-amber-900">{formatTime(game.tipOffMinutes)}</span>
                      <span className="block mt-1 text-amber-800 font-mono text-xs uppercase tracking-wider">Tip-Off</span>
                      <span className="block text-[10px] text-amber-700 font-medium">game time</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50">
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-extrabold text-slate-900 text-xs truncate">{game.venueName}</span>
                      </div>
                      <span className="text-slate-600 text-[11px] font-medium truncate block ml-4">
                        {game.venueAddress}, {game.city}
                      </span>
                    </div>
                    <a 
                      href={getMapsUrl(`${game.venueName} ${game.venueAddress} ${game.city}`)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="shrink-0 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-2xs"
                    >
                      <Navigation className="w-3 h-3 text-amber-600" /> Directions
                    </a>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setOpenTipsGameId(openTipsGameId === game.id ? null : game.id)}
                      aria-expanded={openTipsGameId === game.id}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-slate-800 active:scale-[0.98] transition-transform duration-100 ease-out cursor-pointer"
                    >
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Ground-Truth Tips
                        <span className="inline-flex items-center border-l-2 border-l-amber-600 bg-amber-50 text-amber-900 font-mono text-xs px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                          {gameAlerts.length}
                        </span>
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openTipsGameId === game.id ? "rotate-180" : ""}`} />
                    </button>

                    {openTipsGameId === game.id && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-50/60 border-t border-slate-200 space-y-2.5 animate-in fade-in-50 slide-in-from-top-1 duration-200 ease-out">
                        {gameAlerts.length === 0 ? (
                          <p className="text-[11px] text-slate-600 font-medium italic">No facility warnings posted yet for this gym.</p>
                        ) : (
                          <div className="space-y-2">
                            {gameAlerts.map(alert => (
                              <div key={alert.id} className="bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-xl p-3 space-y-2">
                                <div>
                                  <h4 className="text-xs font-extrabold text-slate-900">{alert.title}</h4>
                                  <p className="text-xs text-slate-600 font-medium leading-snug mt-0.5">{alert.content}</p>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px] text-slate-500 font-medium">
                                  <span>By {alert.author}</span>
                                  <button
                                    onClick={() => upvoteAlert(alert.id)}
                                    className="flex items-center gap-1.5 font-bold text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg active:scale-95 transition-transform duration-100 ease-out cursor-pointer"
                                  >
                                    <ThumbsUp className="w-3 h-3 text-amber-600" /> Helpful ({alert.upvotes})
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => setActiveModalGameId(game.id)}
                          className="w-full flex items-center justify-center gap-1 text-[11px] uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs px-2.5 py-2 rounded-xl active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Tip
                        </button>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="border-t border-slate-200 bg-slate-50 -mx-5 -mb-5 p-3.5 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                        <span className="uppercase tracking-wider">Manager Quick-Shift:</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => shiftGameTime(game.id, -30)} 
                          className="bg-white border border-slate-200 hover:bg-slate-100 active:scale-[0.96] px-2.5 py-1.5 rounded-lg text-slate-800 font-extrabold shadow-2xs transition-transform duration-100 ease-out cursor-pointer"
                        >
                          -30m
                        </button>
                        <button 
                          onClick={() => shiftGameTime(game.id, -15)} 
                          className="bg-white border border-slate-200 hover:bg-slate-100 active:scale-[0.96] px-2.5 py-1.5 rounded-lg text-slate-800 font-extrabold shadow-2xs transition-transform duration-100 ease-out cursor-pointer"
                        >
                          -15m
                        </button>
                        <button 
                          onClick={() => shiftGameTime(game.id, 15)} 
                          className="bg-amber-50 border border-amber-300 hover:bg-amber-100 active:scale-[0.96] px-2.5 py-1.5 rounded-lg text-amber-900 font-extrabold shadow-2xs transition-transform duration-100 ease-out cursor-pointer"
                        >
                          +15m
                        </button>
                        <button 
                          onClick={() => shiftGameTime(game.id, 30)} 
                          className="bg-amber-50 border border-amber-300 hover:bg-amber-100 active:scale-[0.96] px-2.5 py-1.5 rounded-lg text-amber-900 font-extrabold shadow-2xs transition-transform duration-100 ease-out cursor-pointer"
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
              <span className="p-1 rounded-md bg-white border border-slate-200 text-amber-600 shadow-2xs">
                <Utensils className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                {isLunch ? "Midday Fuel (Grab & Go)" : "Team Dinner & Reservation"}
              </h3>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 p-0.5 rounded-xl text-[10px]">
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
          <div className="bg-white text-slate-900 rounded-2xl p-4.5 border border-slate-200/90 shadow-sm shadow-slate-200/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                {isLunch ? <Salad className="w-4 h-4 text-amber-600" /> : <Utensils className="w-4 h-4 text-amber-600" />}
                {isLunch ? "Lunch Downtime Window" : "Dinner Downtime Window"}
              </span>
              <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-600 bg-amber-50 text-amber-900 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                {windowHours}h {windowRemainingMins}m Window
              </span>
            </div>
            
            <div className="mt-3.5 flex items-baseline justify-between border-t border-slate-200 pt-3">
              <div>
                <p className="text-slate-500 font-mono text-xs uppercase tracking-wider">Available Downtime:</p>
                <p className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5 tabular-nums">
                  {formatTime(activeWindowStart)} – {formatTime(activeWindowEnd)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 font-mono text-xs uppercase tracking-wider">
                  {isLunch ? "Game 2 Arrival" : "Evening Wind-Down"}
                </p>
                <p className="text-xs font-extrabold text-amber-700 mt-0.5">
                  {isLunch 
                    ? `Be at gym by ${formatTime(activeWindowEnd)}`
                    : `Back at hotel by ${formatTime(activeWindowEnd)}`}
                </p>
              </div>
            </div>
          </div>

          {/* LUNCH: GRAB & GO */}
          {isLunch ? (
            <div className="bg-white border border-slate-200/90 shadow-sm shadow-slate-200/50 rounded-3xl p-5 transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-bottom-2 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" /> Fast Athlete Fuel Near Gym
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    No reservations needed — quick wraps, smoothies, & light carbs
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 border-l-2 border-l-emerald-600 bg-emerald-50 text-emerald-900 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none shrink-0">
                  Grab & Go
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {quickLunchSpots.map((spot, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs flex items-center justify-between gap-2 shadow-2xs transition-colors">
                    <div className="pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-slate-900">{spot.name}</span>
                        <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-100 text-slate-800 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                          {spot.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                        {spot.distance} • <span className="text-slate-600">{spot.note}</span>
                      </span>
                    </div>

                    <a 
                      href={getMapsUrl(spot.name + " " + spot.address)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="shrink-0 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-2xs"
                    >
                      <Navigation className="w-3.5 h-3.5 text-amber-600" /> Map
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* DINNER: FORMAL CONSENSUS & RESERVATION POLL */
            <div className="bg-white border border-slate-200/90 shadow-sm shadow-slate-200/50 rounded-3xl p-5 transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-bottom-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  {isVoteLocked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Timer className="w-3.5 h-3.5 text-amber-600" />}
                  {isVoteLocked ? "Confirmed Team Dinner Reservation" : "Team Dinner Reservation Poll"}
                </span>
                <span className={`inline-flex items-center gap-1 border-l-2 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none ${
                  isVoteLocked ? "border-l-amber-600 bg-amber-50 text-amber-900" : "border-l-slate-400 bg-slate-100 text-slate-800"
                }`}>
                  {isVoteLocked ? "Poll Closed" : "Tap to vote"}
                </span>
              </div>

              {winningOption && (
                <div className="bg-slate-50 text-slate-900 rounded-xl p-4 shadow-2xs border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5">
                      {winningOption.isDelivery ? <Pizza className="w-3.5 h-3.5 text-amber-600" /> : <Users className="w-3.5 h-3.5 text-amber-600" />}
                      {winningOption.isDelivery ? "Lobby Delivery Target" : "Final Reservation Target"}
                    </span>
                    <span className="inline-flex items-center gap-1 border-l-2 border-l-emerald-600 bg-emerald-50 text-emerald-900 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                      {confirmedReservationSeats} Total Seats
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="text-sm font-extrabold text-slate-900 truncate max-w-[190px]">{winningOption.name}</span>
                    <span className="text-[11px] font-medium text-slate-600">
                      {confirmedPlayers} Players • {confirmedParents} Parents
                    </span>
                  </div>

                  {winningOption.isDelivery && (
                    <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center justify-between font-medium">
                      <span>Target Order: <strong className="text-slate-900 font-extrabold">~{estimatedPizzas} Large Pizzas</strong></span>
                      <span className="text-[10px] text-slate-600">1 pie per 2.5 people</span>
                    </div>
                  )}

                  {isVoteLocked && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                      <span className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" /> {winningOption.phone}
                      </span>
                      <a 
                        href={`tel:${winningOption.phone.replace(/[^0-9]/g, "")}`}
                        className="text-[11px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-xs"
                      >
                        {winningOption.isDelivery ? "Call Pizza Order" : "Call to Reserve"}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {isVoteLocked && winningOption && !isVoterOfWinner && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2.5 animate-in fade-in duration-200">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900 block">
                      {winningOption.name} won the vote!
                    </span>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-snug">
                      You previously picked {options.find(o => o.id === userVotedId)?.name || "another spot"}. Are you joining the team table?
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      onClick={() => setUserFinalAttendance("attending")}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer ${
                        userFinalAttendance === "attending"
                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300"
                          : "bg-white border border-amber-300 text-amber-900 hover:bg-amber-100"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Count Us In ({userPartyTotal} seats)
                    </button>

                    <button
                      onClick={() => setUserFinalAttendance("declined")}
                      className={`py-2 px-3 rounded-xl text-xs font-bold active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer ${
                        userFinalAttendance === "declined"
                          ? "bg-slate-800 text-white"
                          : "bg-transparent text-slate-600 hover:bg-amber-100/60"
                      }`}
                    >
                      Splitting Off
                    </button>
                  </div>
                </div>
              )}

              {isVoteLocked && winningOption && isVoterOfWinner && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-extrabold">You are included in the headcount ({userPartyTotal} seats)</span>
                  </div>
                  <span className="inline-flex items-center gap-1 border-l-2 border-l-emerald-600 bg-emerald-50 text-emerald-900 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                    Confirmed
                  </span>
                </div>
              )}

              {!isVoteLocked && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-600" /> Your Family Count:
                    </span>
                    <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-600 bg-amber-50 text-amber-900 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                      {userPartyTotal} Seat{userPartyTotal > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
                      <span className="text-slate-600 font-bold text-[11px] uppercase">Players:</span>
                      <div className="flex items-center gap-2 font-black">
                        <button 
                          onClick={() => updatePartyCounts(-1, 0)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 active:scale-[0.96] text-slate-900 transition-transform duration-100 ease-out cursor-pointer"
                        >-</button>
                        <span className="w-4 text-center tabular-nums text-sm font-extrabold text-slate-900">{userParty.players}</span>
                        <button 
                          onClick={() => updatePartyCounts(1, 0)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 active:scale-[0.96] text-slate-900 transition-transform duration-100 ease-out cursor-pointer"
                        >+</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
                      <span className="text-slate-600 font-bold text-[11px] uppercase">Parents:</span>
                      <div className="flex items-center gap-2 font-black">
                        <button 
                          onClick={() => updatePartyCounts(0, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 active:scale-[0.96] text-slate-900 transition-transform duration-100 ease-out cursor-pointer"
                        >-</button>
                        <span className="w-4 text-center tabular-nums text-sm font-extrabold text-slate-900">{userParty.parents}</span>
                        <button 
                          onClick={() => updatePartyCounts(0, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 active:scale-[0.96] text-slate-900 transition-transform duration-100 ease-out cursor-pointer"
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
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-white stroke-[3]" /> Suggest a Spot
                  </button>

                  <button
                    type="button"
                    onClick={handleAddHotelPizzaPreset}
                    className="py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-2xs"
                  >
                    <Pizza className="w-3.5 h-3.5 text-amber-600" /> Lobby Pizza Pivot
                  </button>
                </div>
              )}

              {!isVoteLocked && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block leading-tight">
                        Vote closes at {formatTime(voteClosingMinutes)}
                      </span>
                      <span className="text-[11px] font-medium text-slate-600 block leading-tight mt-0.5">
                        Manager will finalize reservation before tip-off
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-600 bg-amber-50 text-amber-900 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none shrink-0">
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
                              ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20" 
                              : "bg-slate-50 border-slate-200 opacity-60")
                          : (isWinner 
                              ? "bg-amber-50/40 border-amber-400 ring-2 ring-amber-400/20 shadow-xs" 
                              : "bg-white border-slate-200/90 hover:border-slate-300")
                      }`}
                    >
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold block text-slate-900">
                            {option.name}
                          </span>
                          {isWinner && (
                            <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-600 bg-amber-50 text-amber-900 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                              <Trophy className="w-2.5 h-2.5 text-amber-600" /> {isVoteLocked ? "Selected Choice" : "Leading"}
                            </span>
                          )}
                          {option.isCustom && !isWinner && (
                            <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-100 text-slate-800 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                              <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Parent Pick
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                          {option.type} • <span className="font-bold text-slate-800">{option.playerCount}p + {option.parentCount} adults</span> {isUserPick && "• (Your vote)"}
                        </span>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`font-black px-3 py-1 rounded-lg text-xs block tabular-nums shadow-2xs ${
                          isWinner 
                            ? "bg-emerald-600 text-white" 
                            : "bg-slate-100 text-slate-900 border border-slate-200"
                        }`}>
                          {option.totalSeats} seats
                        </span>
                        <span className="text-slate-500 font-mono text-xs block mt-0.5 uppercase tracking-wider">
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
        <section id="section-coffee" className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm shadow-slate-200/50 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
                <Coffee className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  Sideline Fuel
                </h3>
                <span className="text-[11px] text-slate-600 font-medium">Coffee Radar & Parent Pit Stops</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 border-l-2 border-l-amber-600 bg-amber-50 text-amber-900 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
              Nearby Gym
            </span>
          </div>

          <div className="space-y-2.5">
            {coffeeSpots.map((spot, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs shadow-2xs transition-colors">
                <div className="pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-slate-900">{spot.name}</span>
                    <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-100 text-slate-800 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                      {spot.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 block mt-0.5 font-medium">
                    {spot.distance} • <span className="text-slate-600">{spot.note}</span>
                  </span>
                </div>
                <a 
                  href={getMapsUrl(spot.name + " " + spot.address)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="shrink-0 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-2xs"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-600" /> Map
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
        <section id="section-hotel" className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm shadow-slate-200/50 hover:border-slate-300 transition-colors space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 border-l-2 border-l-slate-400 bg-slate-100 text-slate-800 font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                <Hotel className="w-3 h-3 text-slate-600" /> Team Hotel Base Camp
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-1.5 mt-2 tracking-tight">
                {tournament.hotel.name}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{tournament.hotel.address}</p>
            </div>
            <a 
              href={getMapsUrl(tournament.hotel.address)} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs flex items-center gap-1.5 text-slate-900 font-extrabold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-xl active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer shadow-2xs shrink-0"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-600" /> Map
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200 pt-3">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-mono text-xs uppercase tracking-wider block">Breakfast</span>
              <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{tournament.hotel.breakfastHours}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-slate-500 font-mono text-xs uppercase tracking-wider block">Checkout</span>
              <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{tournament.hotel.checkoutTime}</span>
            </div>
          </div>

          {/* Hotel Intel / Tips Collapsible Accordion */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setOpenTipsGameId(openTipsGameId === "hotel" ? null : "hotel")}
              aria-expanded={openTipsGameId === "hotel"}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg text-slate-800 active:scale-[0.98] transition-transform duration-100 ease-out cursor-pointer"
            >
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Hotel Intel / Tips
                <span className="inline-flex items-center border-l-2 border-l-amber-600 bg-amber-50 text-amber-900 font-mono text-xs px-2 py-0.5 rounded-r cursor-default pointer-events-none select-none">
                  {hotelAlerts.length}
                </span>
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openTipsGameId === "hotel" ? "rotate-180" : ""}`} />
            </button>

            {openTipsGameId === "hotel" && (
              <div className="mt-2 p-3 rounded-xl bg-slate-50/60 border-t border-slate-200 space-y-2.5 animate-in fade-in-50 slide-in-from-top-1 duration-200 ease-out">
                {hotelAlerts.length === 0 ? (
                  <p className="text-[11px] text-slate-600 font-medium italic">No hotel tips posted yet.</p>
                ) : (
                  <div className="space-y-2">
                    {hotelAlerts.map(alert => (
                      <div key={alert.id} className="bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-xl p-3 space-y-2">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">{alert.title}</h4>
                          <p className="text-xs text-slate-600 font-medium leading-snug mt-0.5">{alert.content}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px] text-slate-500 font-medium">
                          <span>By {alert.author}</span>
                          <button
                            onClick={() => upvoteAlert(alert.id)}
                            className="flex items-center gap-1.5 font-bold text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg active:scale-95 transition-transform duration-100 ease-out cursor-pointer"
                          >
                            <ThumbsUp className="w-3 h-3 text-amber-600" /> Helpful ({alert.upvotes})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setActiveModalGameId("hotel")}
                  className="w-full flex items-center justify-center gap-1 text-[11px] uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs px-2.5 py-2 rounded-xl active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
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
        <nav className="pointer-events-auto mx-auto w-full max-w-md grid grid-cols-3 gap-1 bg-white/90 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-1.5 shadow-xl shadow-slate-900/5">
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
                  ? "bg-amber-500 text-white shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900 font-medium"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Suggest a Spot</h3>
                <p className="text-xs text-slate-600 font-medium">Know a great place for the team table?</p>
              </div>
              <button 
                onClick={() => setIsRestaurantModalOpen(false)}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomRestaurant} className="space-y-3.5">
              <div>
                <label className="block text-slate-500 font-mono text-xs uppercase tracking-wider mb-1">Restaurant Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. The Cheshire Cat Pub, East Side Mario's" 
                  value={suggestName}
                  onChange={e => setSuggestName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-mono text-xs uppercase tracking-wider mb-1.5">Vibe / Why this spot?</label>
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
                          ? "bg-amber-500 text-white border-amber-500 shadow-xs" 
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-mono text-xs uppercase tracking-wider mb-1">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  placeholder="e.g. (613) 555-0199" 
                  value={suggestPhone}
                  onChange={e => setSuggestPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-mono text-xs uppercase tracking-wider mb-1">Your Name / Tag</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kelly (#7 Mom)" 
                  value={suggestAuthor}
                  onChange={e => setSuggestAuthor(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setIsRestaurantModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-black hover:bg-amber-700 shadow-xs active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                >
                  Add & Vote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parent Ground-Truth Modal */}
      {activeModalGameId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {activeModalGameId === "hotel" ? "Add Hotel Intel / Tip" : "Add Venue Ground-Truth Tip"}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  For {activeModalGameId === "hotel" ? tournament.hotel.name : (games.find(g => g.id === activeModalGameId)?.venueName || "this gym")}
                </p>
              </div>
              <button 
                onClick={() => setActiveModalGameId(null)}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTip} className="space-y-3.5">
              <div>
                <label className="block text-slate-500 font-mono text-xs uppercase tracking-wider mb-1.5">Category</label>
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
                          ? "bg-amber-500 text-white border-amber-500 shadow-xs font-black" 
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-mono text-xs uppercase tracking-wider mb-1">Headline</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Bring cash for gate" 
                  value={tipTitle}
                  onChange={e => setTipTitle(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-mono text-xs uppercase tracking-wider mb-1">What should parents know?</label>
                <textarea 
                  required
                  rows={2}
                  maxLength={140}
                  placeholder="e.g. Lot P5 is full. Gate entry is around the back entrance." 
                  value={tipContent}
                  onChange={e => setTipContent(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-mono text-xs uppercase tracking-wider mb-1">Your Name / Tag (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dave (#14 Dad)" 
                  value={tipAuthor}
                  onChange={e => setTipAuthor(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setActiveModalGameId(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-black hover:bg-amber-700 shadow-xs active:scale-[0.96] transition-transform duration-100 ease-out cursor-pointer"
                >
                  Post Tip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RunSheetContent;
