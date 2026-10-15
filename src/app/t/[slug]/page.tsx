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
  Salad
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Sticky App Header */}
      <header className="sticky top-0 z-30 bg-slate-950 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">AwayDay Run-Sheet</span>
              {isAdmin && (
                <span className="text-[9px] font-extrabold uppercase bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded">
                  Manager Mode
                </span>
              )}
            </div>
            <h1 className="text-base font-black leading-tight truncate">{tournament.teamName}</h1>
          </div>

          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync
            </span>
          </div>
        </div>

        {/* Centered Freshness & Date Micro-bar */}
        <div className="bg-slate-900 border-t border-slate-800/80 px-4 py-1.5 flex items-center justify-center gap-2 text-[11px] text-center">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium truncate">
            <Radio className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{tournament.lastUpdatedText}</span>
          </div>
          <span className="text-slate-600 font-bold">•</span>
          <span className="text-[11px] text-amber-400 font-bold shrink-0">Sat, Oct 3</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-3 space-y-3.5">
        {/* Fast 1-Tap Jump Navigation Menu */}
        <nav className="grid grid-cols-4 gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => scrollToSection("section-games")}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-[10px] font-bold active:scale-95 transition-all"
          >
            <CalendarDays className="w-4 h-4 text-indigo-600 mb-1" />
            <span>Games</span>
          </button>

          <button
            onClick={() => scrollToSection("section-meals")}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-[10px] font-bold active:scale-95 transition-all"
          >
            <Utensils className="w-4 h-4 text-emerald-600 mb-1" />
            <span>{isLunch ? "Quick Fuel" : "Dinner"}</span>
          </button>

          <button
            onClick={() => scrollToSection("section-coffee")}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-[10px] font-bold active:scale-95 transition-all"
          >
            <Coffee className="w-4 h-4 text-amber-600 mb-1" />
            <span>Coffee</span>
          </button>

          <button
            onClick={() => scrollToSection("section-hotel")}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-[10px] font-bold active:scale-95 transition-all"
          >
            <Hotel className="w-4 h-4 text-indigo-600 mb-1" />
            <span>Hotel</span>
          </button>
        </nav>

        {/* Executive Trip Anchor Banner */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
          <div className="flex items-start justify-between">
            <div className="space-y-1 pr-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-950" /> {tournament.city}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-indigo-400" /> {tournament.leagueName}
                </span>
              </div>

              <h2 className="text-base font-black text-white tracking-tight pt-1">
                {tournament.name}
              </h2>
              
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium pt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Primary Hub: <strong className="text-white">{tournament.primaryHub}</strong></span>
              </div>
            </div>

            <a 
              href={getMapsUrl(tournament.primaryHubAddress)} 
              target="_blank" 
              rel="noreferrer"
              className="shrink-0 text-xs flex items-center gap-1 font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-xl active:scale-95 transition-all shadow-xs"
            >
              <Navigation className="w-3 h-3 text-amber-400" /> Hub
            </a>
          </div>
        </section>

        {/* Weekend Run-Sheet */}
        <section id="section-games" className="space-y-4 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-indigo-50 text-indigo-700">
                <CalendarDays className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Weekend Run-Sheet</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">{games.length} Games Scheduled</span>
          </div>

          {games.map((game, index) => {
            const departMinutes = game.tipOffMinutes - game.warmupBufferMin - game.hotelTravelMin;
            const arrivalMinutes = game.tipOffMinutes - game.warmupBufferMin;
            const gameAlerts = alerts.filter(a => a.gameId === game.id);

            return (
              <div key={game.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Game {index + 1}</span>
                    <span className="text-sm font-bold truncate">vs. {game.opponent}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                      {game.court}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 block mt-1">{formatTime(game.tipOffMinutes)}</span>
                  </div>
                </div>

                <div className="p-3.5 space-y-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Car className="w-3.5 h-3.5 text-slate-400" /> Hotel Departure:
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatTime(departMinutes)} ({game.hotelTravelMin}m drive)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> Gym Arrival:
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatTime(arrivalMinutes)} (30m before tip-off)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white">
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-900 truncate">{game.venueName}</span>
                      </div>
                      <span className="text-slate-500 text-[11px] truncate block ml-4">
                        {game.venueAddress}, {game.city}
                      </span>
                    </div>
                    <a 
                      href={getMapsUrl(`${game.venueName} ${game.venueAddress} ${game.city}`)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <Navigation className="w-3 h-3 text-amber-400" /> Map
                    </a>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> Venue Ground-Truth
                      </span>
                      <button 
                        onClick={() => setActiveModalGameId(game.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md border border-amber-300 active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Tip
                      </button>
                    </div>

                    {gameAlerts.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No facility warnings posted yet for this gym.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {gameAlerts.map(alert => (
                          <div key={alert.id} className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-2.5 space-y-1.5">
                            <div className="flex items-start justify-between gap-1.5">
                              <div>
                                <h4 className="text-xs font-bold text-amber-950">{alert.title}</h4>
                                <p className="text-[11px] text-amber-900/90 leading-snug">{alert.content}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-amber-200/50 pt-1 text-[10px] text-amber-800">
                              <span>By {alert.author}</span>
                              <button 
                                onClick={() => upvoteAlert(alert.id)}
                                className="flex items-center gap-1 font-bold bg-white/90 border border-amber-300 hover:bg-amber-100 px-2 py-0.5 rounded active:scale-95 transition-transform"
                              >
                                <ThumbsUp className="w-2.5 h-2.5" /> Helpful ({alert.upvotes})
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="border-t border-amber-200 bg-amber-50/60 -mx-3.5 -mb-3.5 p-3 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 font-bold text-amber-950">
                        <SlidersHorizontal className="w-3 h-3 text-amber-700" />
                        <span>Manager Quick-Shift:</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => shiftGameTime(game.id, -30)} 
                          className="bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 px-2 py-1 rounded text-slate-700 font-bold"
                        >
                          -30m
                        </button>
                        <button 
                          onClick={() => shiftGameTime(game.id, -15)} 
                          className="bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 px-2 py-1 rounded text-slate-700 font-bold"
                        >
                          -15m
                        </button>
                        <button 
                          onClick={() => shiftGameTime(game.id, 15)} 
                          className="bg-amber-200 border border-amber-400 hover:bg-amber-300 active:bg-amber-400 px-2 py-1 rounded text-amber-950 font-bold"
                        >
                          +15m
                        </button>
                        <button 
                          onClick={() => shiftGameTime(game.id, 30)} 
                          className="bg-amber-200 border border-amber-400 hover:bg-amber-300 active:bg-amber-400 px-2 py-1 rounded text-amber-950 font-bold"
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

        {/* =========================================================
            MEAL INFO SECTION (Dynamically Computed Timestamps)
        ========================================================= */}
        <section id="section-meals" className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">
                <Utensils className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                {isLunch ? "Midday Fuel (Grab & Go)" : "Team Dinner & Reservation"}
              </h3>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 p-0.5 rounded-lg text-[10px]">
                <button
                  type="button"
                  onClick={handleToggleMealMode}
                  className="px-2 py-0.5 rounded-md font-bold text-amber-950 hover:bg-amber-100 bg-white shadow-xs border border-amber-200 active:scale-95 transition-all"
                >
                  Admin Toggle: {isLunch ? "🌙 Show Dinner" : "🥪 Show Lunch"}
                </button>
              </div>
            )}
          </div>

          {/* Downtime Window Card with Corrected Timestamps */}
          <div className="bg-slate-950 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-white flex items-center gap-1.5">
                {isLunch ? <Salad className="w-4 h-4 text-emerald-400" /> : <Utensils className="w-4 h-4 text-amber-400" />}
                {isLunch ? "Lunch Downtime Window" : "Dinner Downtime Window"}
              </span>
              <span className="text-xs bg-slate-800 text-white px-2.5 py-0.5 rounded-full font-bold border border-slate-700">
                {windowHours}h {windowRemainingMins}m Window
              </span>
            </div>
            
            <div className="mt-3.5 flex items-baseline justify-between border-t border-slate-800 pt-3">
              <div>
                <p className="text-xs font-semibold text-slate-300">Available Downtime:</p>
                <p className="text-sm font-black text-white tracking-tight mt-0.5">
                  {formatTime(activeWindowStart)} – {formatTime(activeWindowEnd)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">
                  {isLunch ? "Game 2 Arrival" : "Evening Wind-Down"}
                </p>
                <p className="text-xs font-black text-emerald-400 mt-0.5">
                  {isLunch 
                    ? `Be at gym by ${formatTime(activeWindowEnd)}`
                    : `Back at hotel by ${formatTime(activeWindowEnd)}`}
                </p>
              </div>
            </div>
          </div>

          {/* LUNCH: GRAB & GO */}
          {isLunch ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" /> Fast Athlete Fuel Near Gym
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    No reservations needed — quick wraps, smoothies, & light carbs
                  </p>
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                  Quick Turnaround
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {quickLunchSpots.map((spot, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 text-xs flex items-center justify-between gap-2">
                    <div className="pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{spot.name}</span>
                        <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded">
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
                      className="shrink-0 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform shadow-xs"
                    >
                      <Navigation className="w-3 h-3 text-indigo-600" /> Map
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* DINNER: FORMAL CONSENSUS & RESERVATION POLL */
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  {isVoteLocked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Timer className="w-3.5 h-3.5 text-indigo-600" />}
                  {isVoteLocked ? "Confirmed Team Dinner Reservation" : "Team Dinner Reservation Poll"}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isVoteLocked ? "bg-amber-100 text-amber-900 border border-amber-200" : "bg-slate-100 text-slate-600"
                }`}>
                  {isVoteLocked ? "Poll Closed" : "Tap to vote"}
                </span>
              </div>

              {winningOption && (
                <div className="bg-slate-900 text-white rounded-xl p-3 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                      {winningOption.isDelivery ? <Pizza className="w-3.5 h-3.5 text-amber-400" /> : <Users className="w-3.5 h-3.5 text-amber-400" />}
                      {winningOption.isDelivery ? "Lobby Delivery Target" : "Final Reservation Target"}
                    </span>
                    <span className="text-xs font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded">
                      {confirmedReservationSeats} Total Seats
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="font-bold text-white truncate max-w-[190px]">{winningOption.name}</span>
                    <span className="text-[11px] text-slate-300">
                      {confirmedPlayers} Players • {confirmedParents} Parents
                    </span>
                  </div>

                  {winningOption.isDelivery && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded-lg p-2 flex items-center justify-between">
                      <span>Target Order: <strong>~{estimatedPizzas} Large Pizzas</strong></span>
                      <span className="text-[10px] text-slate-300">1 pie per 2.5 people</span>
                    </div>
                  )}

                  {isVoteLocked && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-300 flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-emerald-400" /> {winningOption.phone}
                      </span>
                      <a 
                        href={`tel:${winningOption.phone.replace(/[^0-9]/g, "")}`}
                        className="text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        {winningOption.isDelivery ? "Call Pizza Order" : "Call to Reserve"}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {isVoteLocked && winningOption && !isVoterOfWinner && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 space-y-2.5 animate-in fade-in duration-200">
                  <div>
                    <span className="text-xs font-black text-amber-950 block">
                      {winningOption.name} won the vote!
                    </span>
                    <p className="text-[11px] text-amber-900/90 mt-0.5 leading-snug">
                      You previously picked {options.find(o => o.id === userVotedId)?.name || "another spot"}. Are you joining the team table?
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      onClick={() => setUserFinalAttendance("attending")}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        userFinalAttendance === "attending"
                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300"
                          : "bg-white border border-amber-300 text-amber-950 hover:bg-amber-100"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Count Us In ({userPartyTotal} seats)
                    </button>

                    <button
                      onClick={() => setUserFinalAttendance("declined")}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        userFinalAttendance === "declined"
                          ? "bg-slate-800 text-white"
                          : "bg-transparent text-amber-800 hover:bg-amber-100/60"
                      }`}
                    >
                      Splitting Off
                    </button>
                  </div>
                </div>
              )}

              {isVoteLocked && winningOption && isVoterOfWinner && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-950">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold">You are included in the headcount ({userPartyTotal} seats)</span>
                  </div>
                  <span className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                    Confirmed
                  </span>
                </div>
              )}

              {!isVoteLocked && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Your Family Count:
                    </span>
                    <span className="text-xs font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                      {userPartyTotal} Seat{userPartyTotal > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-slate-600 font-medium text-[11px]">Players:</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <button 
                          onClick={() => updatePartyCounts(-1, 0)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >-</button>
                        <span className="w-4 text-center">{userParty.players}</span>
                        <button 
                          onClick={() => updatePartyCounts(1, 0)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >+</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <span className="text-slate-600 font-medium text-[11px]">Parents:</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <button 
                          onClick={() => updatePartyCounts(0, -1)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >-</button>
                        <span className="w-4 text-center">{userParty.parents}</span>
                        <button 
                          onClick={() => updatePartyCounts(0, 1)}
                          className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
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
                    className="py-2 px-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" /> Suggest a Spot
                  </button>

                  <button
                    type="button"
                    onClick={handleAddHotelPizzaPreset}
                    className="py-2 px-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-950 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Pizza className="w-3.5 h-3.5 text-amber-700" /> Lobby Pizza Pivot
                  </button>
                </div>
              )}

              {!isVoteLocked && (
                <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-amber-950 block leading-tight">
                        Vote closes at {formatTime(voteClosingMinutes)}
                      </span>
                      <span className="text-[10px] text-amber-800/90 block leading-tight mt-0.5">
                        Manager will finalize reservation before tip-off
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded shrink-0">
                    Locks Soon
                  </span>
                </div>
              )}

              <div className="space-y-2 pt-0.5">
                {options.map(option => {
                  const isWinner = winningOption?.id === option.id;
                  const isUserPick = userVotedId === option.id;

                  return (
                    <button
                      key={option.id}
                      disabled={isVoteLocked}
                      onClick={() => handleSelectOption(option.id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all relative ${
                        isVoteLocked 
                          ? (isWinner 
                              ? "bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-300" 
                              : "bg-slate-50/60 border-slate-200 opacity-60")
                          : (isWinner 
                              ? "bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-300 shadow-sm" 
                              : "bg-white border-slate-200 hover:border-slate-300 active:scale-[0.99]")
                      }`}
                    >
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold block ${isWinner ? "text-slate-900" : "text-slate-800"}`}>
                            {option.name}
                          </span>
                          {isWinner && (
                            <span className="flex items-center gap-0.5 text-[9px] font-extrabold uppercase bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded">
                              <Trophy className="w-2.5 h-2.5" /> {isVoteLocked ? "Selected Choice" : "Leading"}
                            </span>
                          )}
                          {option.isCustom && !isWinner && (
                            <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Parent Pick
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {option.type} • <span className="font-semibold text-slate-700">{option.playerCount}p + {option.parentCount} adults</span> {isUserPick && "• (Your vote)"}
                        </span>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`font-black px-2.5 py-1 rounded-md text-xs block ${
                          isWinner 
                            ? "bg-emerald-600 text-white" 
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {option.totalSeats} seats
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
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
        <section id="section-coffee" className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-700">
                <Coffee className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Sideline Fuel
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">Coffee Radar & Parent Pit Stops</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
              Nearby Gym
            </span>
          </div>

          <div className="space-y-2">
            {coffeeSpots.map((spot, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 text-xs">
                <div className="pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">{spot.name}</span>
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
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
                  className="shrink-0 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform shadow-xs"
                >
                  <Navigation className="w-3 h-3 text-indigo-600" /> Map
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Hotel Base Camp */}
        <section id="section-hotel" className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded flex items-center gap-1">
                <Hotel className="w-3 h-3 text-indigo-600" /> Team Hotel Base Camp
              </span>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-1.5">
                {tournament.hotel.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{tournament.hotel.address}</p>
            </div>
            <a 
              href={getMapsUrl(tournament.hotel.address)} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs flex items-center gap-1 text-indigo-600 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg active:scale-95 transition-transform"
            >
              <Navigation className="w-3.5 h-3.5" /> Map
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Breakfast</span>
              <span className="font-semibold text-slate-700">{tournament.hotel.breakfastHours}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Checkout</span>
              <span className="font-semibold text-slate-700">{tournament.hotel.checkoutTime}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Suggest a Restaurant Modal */}
      {isRestaurantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Suggest a Spot</h3>
                <p className="text-xs text-slate-500">Know a great place for the team table?</p>
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Restaurant Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. The Cheshire Cat Pub, East Side Mario's" 
                  value={suggestName}
                  onChange={e => setSuggestName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Vibe / Why this spot?</label>
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
                      className={`py-2 px-2 rounded-xl text-center border text-[11px] transition-all ${
                        suggestType === cat 
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  placeholder="e.g. (613) 555-0199" 
                  value={suggestPhone}
                  onChange={e => setSuggestPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Your Name / Tag</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kelly (#7 Mom)" 
                  value={suggestAuthor}
                  onChange={e => setSuggestAuthor(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setIsRestaurantModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Venue Ground-Truth Tip</h3>
                <p className="text-xs text-slate-500">
                  For {games.find(g => g.id === activeModalGameId)?.venueName || "this gym"}
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category</label>
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
                      className={`py-2 px-1 rounded-xl text-center border transition-all ${
                        tipCategory === cat.id 
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm" 
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Headline</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Bring cash for gate" 
                  value={tipTitle}
                  onChange={e => setTipTitle(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">What should parents know?</label>
                <textarea 
                  required
                  rows={2}
                  maxLength={140}
                  placeholder="e.g. Lot P5 is full. Gate entry is around the back entrance." 
                  value={tipContent}
                  onChange={e => setTipContent(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Your Name / Tag (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dave (#14 Dad)" 
                  value={tipAuthor}
                  onChange={e => setTipAuthor(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button"
                  onClick={() => setActiveModalGameId(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm"
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

export default function RunSheetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-xs font-bold">Loading AwayDay Run-Sheet...</div>}>
      <RunSheetContent />
    </Suspense>
  );
}
