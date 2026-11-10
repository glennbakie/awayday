export type CorridorDirection = "to_tournament" | "trip_home";

export interface CorridorStop {
  id: string;
  title: string;
  highwayExit: string;
  elapsedDriveLabel: string;
  milestoneTag: string;
  fuelAndCoffeeOptions: string;
  addressQuery: string;
  googleMapsUrl: string;
}

export interface TravelCorridorPlan {
  direction: CorridorDirection;
  origin: string;
  destination: string;
  destinationVenue: string;
  destinationAddress?: string;
  destinationMapsUrl: string;
  highwayRouteSummary: string;
  distanceKm: number;
  durationMinutes: number;
  durationLabel: string;
  recommendedDepartureTitle: string;
  recommendedDepartureLabel: string;
  departureContextNote: string;
  stops: CorridorStop[];
}

export interface CityDiningSpot {
  name: string;
  type: string;
  distance: string;
  note: string;
  address: string;
  phone?: string;
  votes?: number;
  seats?: number;
  players?: number;
  adults?: number;
  percentage?: number;
  isLeading?: boolean;
}

export interface CityFuelRecommendations {
  corridorFoodSpots: CorridorStop[];
  dinnerSpots: CityDiningSpot[];
  quickLunchSpots: CityDiningSpot[];
  coffeeSpots: CityDiningSpot[];
}

export function getDynamicOriginPresets(
  teamHomeBase = "Ottawa, ON",
  hostTournamentCity = "Oakville, ON"
): string[] {
  const cleanHome = (teamHomeBase || "Ottawa, ON").trim();
  const baseCityName = cleanHome.split(",")[0].trim() || "Home";
  const normHome = cleanHome.toLowerCase();

  const westSuburb = normHome.includes("ottawa")
    ? `${baseCityName} West (Kanata)`
    : `${baseCityName} West Suburbs`;
  const eastSuburb = normHome.includes("ottawa")
    ? `${baseCityName} East (Orleans)`
    : `${baseCityName} East Suburbs`;

  const cleanHost = (hostTournamentCity || "Oakville, ON")
    .replace(/\s*\/.*$/, "")
    .trim();

  return [
    cleanHome,
    westSuburb,
    eastSuburb,
    `${cleanHost} (Host City)`,
    "Custom City / Zip...",
  ];
}

export const CORRIDOR_ORIGIN_PRESETS = getDynamicOriginPresets("Ottawa, ON", "Oakville, ON");

export function getGoogleMapsDeepLink(address: string): string {
  const destinationQuery = encodeURIComponent(address);
  return `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}&travelmode=driving`;
}

export function getGoogleMapsSearchUrl(address: string): string {
  const raw = (address || "").trim();
  const withProvince = /\b(ON|QC|BC|AB|MB|NS|NB|NY|MI|OH|PA|IL|MA)\b/i.test(raw) ? raw : `${raw} ON`;
  const tokens = withProvince
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(encodeURIComponent);
  return `https://www.google.com/maps/search/?api=1&query=${tokens.join("+")}`;
}

export function getCityFuelAndFoodRecommendations(
  cityRaw = "Brampton, ON",
  hotelAddress = "150 Westcreek Blvd, Brampton, ON"
): CityFuelRecommendations {
  const lowerCity = (cityRaw || "").toLowerCase();
  const lowerHotel = (hotelAddress || "").toLowerCase();
  const isOakville = lowerCity.includes("oakville") || lowerCity.includes("burlington");
  const isBrampton =
    lowerCity.includes("brampton") ||
    lowerHotel.includes("westcreek") ||
    lowerHotel.includes("brampton") ||
    !isOakville;

  const s1Addr = "1200 Division St, Kingston, ON K7K 6X4";
  const s2Addr = "Port Hope ONroute Westbound, Hwy 401, Port Hope, ON";
  const corridorFoodSpots: CorridorStop[] = [
    {
      id: "corridor-food-kingston",
      title: "Kingston — Division St Hub & ONroute (Hwy 401 Exit 617)",
      highwayExit: "Hwy 401 Exit 617",
      elapsedDriveLabel: "~2h 05m into drive • Halfway Team Meal Stop",
      milestoneTag: "Hwy 401 Corridor • Halfway Stop",
      fuelAndCoffeeOptions: "Chipotle, Panera Bread, Starbucks, Harper's Burger Bar, Shell Gas",
      addressQuery: s1Addr,
      googleMapsUrl: getGoogleMapsDeepLink(s1Addr),
    },
    {
      id: "corridor-food-porthope",
      title: "Port Hope ONroute / Cobourg (Hwy 401 Exit 472)",
      highwayExit: "Hwy 401 Exit 472",
      elapsedDriveLabel: "~3h 15m into drive • Pre-GTA Stretch & Fuel",
      milestoneTag: "Hwy 401 Corridor • 75% Mark",
      fuelAndCoffeeOptions: "Starbucks, Tim Hortons, Pur & Simple, Subway, Esso Gas",
      addressQuery: s2Addr,
      googleMapsUrl: getGoogleMapsDeepLink(s2Addr),
    },
  ];

  if (!isBrampton && isOakville) {
    return {
      corridorFoodSpots,
      dinnerSpots: [
        {
          name: "Beertown Public House (Oakville)",
          type: "Team Sit-Down",
          distance: "6 min drive from hotel",
          note: "Large group tables and athlete-friendly menu",
          phone: "(905) 849-8696",
          address: "271 Cornwall Rd, Oakville, ON",
          votes: 0,
          seats: 0,
          players: 0,
          adults: 0,
          percentage: 0,
          isLeading: false,
        },
        {
          name: "Scaddabush Italian Kitchen (Oakville)",
          type: "Pasta & Team Tables",
          distance: "5 min drive from hotel",
          note: "Pre-game pasta bowls & shareable team platters",
          phone: "(905) 829-0070",
          address: "2095 Winston Park Dr, Oakville, ON",
          votes: 0,
          seats: 0,
          players: 0,
          adults: 0,
          percentage: 0,
          isLeading: false,
        },
        {
          name: "State & Main Kitchen (Oakville)",
          type: "Casual / Group Seating",
          distance: "8 min drive from hotel",
          note: "Easy group seating for parents & players",
          phone: "(289) 291-0022",
          address: "478 Dundas St W, Oakville, ON",
          votes: 0,
          seats: 0,
          players: 0,
          adults: 0,
          percentage: 0,
          isLeading: false,
        },
      ],
      quickLunchSpots: [
        {
          name: "Fortinos Hot Bar & Panini Counter",
          type: "Deli Wraps, Pasta & Salad Bar",
          distance: "4 min drive (1.8 km)",
          note: "Huge fresh hot bar, grilled paninis, fruit & hydration — ideal between weekend games.",
          address: "Upper Middle Rd, Burlington, ON",
        },
        {
          name: "Firehouse Subs (Burlington / Oakville)",
          type: "Hot & Cold Subs",
          distance: "5 min drive (2.1 km)",
          note: "Quick hearty subs, easy seating for athletes & parents between games.",
          address: "Burlington, ON",
        },
        {
          name: "Freshii (Dorval Crossing)",
          type: "Smoothies & Bowls",
          distance: "3 min drive (1.3 km)",
          note: "Fast wraps, protein bowls, energizing smoothies. Order ahead on app.",
          address: "Dorval Dr, Oakville, ON",
        },
        {
          name: "Booster Juice",
          type: "Smoothies & Paninis",
          distance: "3 min drive (1.4 km)",
          note: "Quick athlete fuel & hydration between back-to-back games.",
          address: "Oakville, ON",
        },
      ],
      coffeeSpots: [
        {
          name: "Tribeca Coffee Co. (Oakville)",
          distance: "4 min drive (1.6 km)",
          type: "Sit Down & Wi-Fi",
          note: "Craft espresso, warm pastries, great parent lounge spot near Dorval",
          address: "Oakville, ON",
        },
        {
          name: "Tim Hortons (Dorval Crossing)",
          distance: "2 min drive (0.8 km)",
          type: "Drive-Thru",
          note: "Right off Dorval Dr & QEW — fast mobile order pickup before tip-off",
          address: "Dorval Dr, Oakville, ON",
        },
        {
          name: "Peach Coffee Co. (Burlington)",
          distance: "5 min drive (2.2 km)",
          type: "Specialty / Fast",
          note: "Close to Notre Dame CSS for Sunday morning coffee run",
          address: "Burlington, ON",
        },
      ],
    };
  }

  return {
    corridorFoodSpots,
    dinnerSpots: [
      {
        name: "Jack Astor's Bar & Grill (Brampton — Orion Gate)",
        type: "Team Sit-Down & Large Groups",
        distance: "3 min drive from 150 Westcreek Blvd",
        note: "Right across Steeles Ave near Hwy 410 — accommodates 20+ player & parent tables.",
        phone: "(905) 455-5225",
        address: "20 Biscayne Crescent, Brampton, ON",
        votes: 0,
        seats: 0,
        players: 0,
        adults: 0,
        percentage: 0,
        isLeading: false,
      },
      {
        name: "Boston Pizza (Brampton — Steeles & Great Lakes)",
        type: "Pasta, Pizza & Team Tables",
        distance: "4 min drive from 150 Westcreek Blvd",
        note: "Classic team carb-load spot within a 5-minute radius of Fairfield Inn Brampton.",
        phone: "(905) 459-0990",
        address: "80 Great Lakes Dr, Brampton, ON",
        votes: 0,
        seats: 0,
        players: 0,
        adults: 0,
        percentage: 0,
        isLeading: false,
      },
      {
        name: "Lone Star Texas Grill / Chuck's Roadhouse (Brampton)",
        type: "Casual / Group Seating",
        distance: "5 min drive from 150 Westcreek Blvd",
        note: "Fast group seating off Hurontario & County Court Blvd (within 10-min radius of hotel).",
        phone: "(905) 454-0150",
        address: "200 County Ct Blvd, Brampton, ON",
        votes: 0,
        seats: 0,
        players: 0,
        adults: 0,
        percentage: 0,
        isLeading: false,
      },
    ],
    quickLunchSpots: [
      {
        name: "Osmow's Shawarma & Grill (Westcreek / Steeles)",
        type: "Protein Bowls & Wraps",
        distance: "2 min drive (0.6 km from 150 Westcreek Blvd)",
        note: "Steps from Fairfield Inn & Suites Brampton — fast chicken/rice bowls between games.",
        address: "70 Biscayne Crescent, Brampton, ON",
      },
      {
        name: "Freshii & Subway (Orion Gate Plaza — Brampton)",
        type: "Wraps, Smoothies & Sub Platters",
        distance: "3 min drive (1.2 km from 150 Westcreek Blvd)",
        note: "Quick healthy wraps, energizing smoothies, and pre-game sub trays right off Steeles Ave.",
        address: "20 Biscayne Crescent, Brampton, ON",
      },
      {
        name: "Fortinos Hot Bar & Panini Counter (Brampton)",
        type: "Deli Wraps, Pasta & Salad Bar",
        distance: "7 min drive (3.8 km from 150 Westcreek Blvd)",
        note: "Full hot pasta bar, grilled paninis, fruit & Gatorade cases within 10 mins of hotel.",
        address: "55 Mountainash Rd, Brampton, ON",
      },
      {
        name: "Booster Juice & Panera Bread (Bramalea)",
        type: "Smoothies, Soups & Half-Sandwiches",
        distance: "8 min drive (4.1 km from 150 Westcreek Blvd)",
        note: "Ideal light athlete fuel & hydration within a 10-minute radius of the hotel block.",
        address: "25 Peel Centre Dr, Brampton, ON",
      },
    ],
    coffeeSpots: [
      {
        name: "Tim Hortons (Westcreek Blvd & Steeles Ave)",
        distance: "1 min drive (0.4 km from 150 Westcreek Blvd)",
        type: "Drive-Thru & Mobile Pickup",
        note: "Right at the corner of Westcreek Blvd & Steeles — fastest morning coffee run from Fairfield Inn.",
        address: "2565 Steeles Ave E, Brampton, ON",
      },
      {
        name: "Starbucks (Orion Gate / Biscayne Cres — Brampton)",
        distance: "3 min drive (1.1 km from 150 Westcreek Blvd)",
        type: "Sit Down, Wi-Fi & Mobile Order",
        note: "Just across Hwy 410 on Steeles Ave — great parent lounge and espresso stop near hotel.",
        address: "10 Biscayne Crescent, Brampton, ON",
      },
      {
        name: "Second Cup Café (Brampton — Queen & 410)",
        distance: "7 min drive (3.5 km from 150 Westcreek Blvd)",
        type: "Specialty Espresso & Pastries",
        note: "Within 10-minute radius of hotel block for warm pastries and parent downtime.",
        address: "25 Peel Centre Dr, Brampton, ON",
      },
    ],
  };
}

function formatDurationMinutes(totalMins: number): string {
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function formatClockFromMinutes(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const ampm = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${mins < 10 ? "0" : ""}${mins} ${ampm}`;
}

export interface CorridorComputeOptions {
  direction?: CorridorDirection;
  teamHomeBase?: string;
  finalGameTipOffMinutes?: number;
  finalGameDayLabel?: string;
  finalGameVenue?: string;
  destinationAddress?: string;
  schedulePending?: boolean;
}

export function computeTravelCorridor(
  rawOrigin: string,
  destinationCity = "Oakville, ON",
  destinationVenue = "Fairfield Inn Toronto Oakville",
  firstEventArrivalMinutes = 915, // Default 3:15 PM arrival call for 3:45 PM Game 1
  firstEventDayLabel = "Sat, Oct 24",
  options: CorridorComputeOptions = {}
): TravelCorridorPlan {
  const direction: CorridorDirection = options.direction || "to_tournament";
  const teamHomeBase = (options.teamHomeBase || "Ottawa, ON").trim();
  const userOrigin = (rawOrigin || teamHomeBase).replace(/\s*\(Host City\)$/i, "").trim() || teamHomeBase;
  const norm = userOrigin.toLowerCase();
  const destNorm = `${destinationCity} ${destinationVenue} ${options.destinationAddress || ""}`.toLowerCase();
  const isBramptonDest = destNorm.includes("brampton") || destNorm.includes("westcreek");
  const finalApproachOut = isBramptonDest ? "Hwy 410 N (Brampton)" : "Hwy 403 W";
  const finalApproachRet = isBramptonDest ? "Hwy 410 S" : "Hwy 403 E";

  let durationMinutes = isBramptonDest ? 260 : 270; // 4h 20m (Ottawa <-> Brampton) or 4h 30m (Ottawa <-> Oakville)
  let distanceKm = isBramptonDest ? 435 : 445;
  let outboundHighway = `Hwy 417 / Hwy 416 S ➔ Hwy 401 W ➔ ${finalApproachOut}`;
  let returnHighway = `${finalApproachRet} ➔ Hwy 401 E ➔ Hwy 416 N / Hwy 417`;

  if (norm.includes("kanata") || norm.includes("west") || norm.includes("stittsville") || norm.includes("nepean") || /^k2/i.test(norm)) {
    durationMinutes = isBramptonDest ? 245 : 255;
    distanceKm = isBramptonDest ? 415 : 425;
    outboundHighway = `Hwy 7 W / Hwy 416 S ➔ Hwy 401 W ➔ ${finalApproachOut}`;
    returnHighway = `${finalApproachRet} ➔ Hwy 401 E ➔ Hwy 416 N / Hwy 7 E`;
  } else if (norm.includes("orleans") || norm.includes("orléans") || norm.includes("east") || norm.includes("gatineau") || /^k1|^k4|^j8/i.test(norm)) {
    durationMinutes = isBramptonDest ? 275 : 285;
    distanceKm = isBramptonDest ? 455 : 465;
    outboundHighway = `Hwy 417 W ➔ Hwy 416 S ➔ Hwy 401 W ➔ ${finalApproachOut}`;
    returnHighway = `${finalApproachRet} ➔ Hwy 401 E ➔ Hwy 416 N ➔ Hwy 417 E`;
  } else if (norm.includes("montreal") || norm.includes("montréal") || norm.includes("laval") || norm.includes("brossard") || /^h[1-9]/i.test(norm)) {
    durationMinutes = 340; // 5h 40m
    distanceKm = 575;
    outboundHighway = `A-20 O ➔ Hwy 401 W ➔ ${finalApproachOut}`;
    returnHighway = `${finalApproachRet} ➔ Hwy 401 E ➔ A-20 E`;
  } else if (norm.includes("kingston") || norm.includes("belleville") || norm.includes("brockville") || /^k7/i.test(norm)) {
    durationMinutes = 175; // 2h 55m
    distanceKm = 290;
    outboundHighway = `Hwy 401 W ➔ Hwy 407 / ${finalApproachOut}`;
    returnHighway = `${finalApproachRet} / Hwy 407 ➔ Hwy 401 E`;
  } else if (
    norm.includes("peterborough") ||
    norm.includes("oshawa") ||
    norm.includes("barrie") ||
    norm.includes("london") ||
    norm.includes("kitchener") ||
    norm.includes("waterloo") ||
    norm.includes("buffalo") ||
    norm.includes("rochester") ||
    /^l1|^l4|^n[1-6]|^14[0-6]/i.test(norm)
  ) {
    durationMinutes = 130; // 2h 10m
    distanceKm = 185;
    outboundHighway = `Regional Corridor ➔ Hwy 401 / ${finalApproachOut}`;
    returnHighway = `${finalApproachRet} / Hwy 401 ➔ Regional Corridor`;
  } else if (
    norm.includes("oakville") ||
    norm.includes("burlington") ||
    norm.includes("toronto") ||
    norm.includes("mississauga") ||
    norm.includes("brampton") ||
    norm.includes("hamilton") ||
    norm.includes("markham") ||
    norm.includes("vaughan") ||
    /^l[5-9]|^m[1-9]/i.test(norm)
  ) {
    durationMinutes = 30; // < 2 hours local/regional window
    distanceKm = 32;
    outboundHighway = isBramptonDest
      ? "Hwy 401 / Hwy 410 Local Corridor ➔ Steeles Ave E (Westcreek Blvd)"
      : "QEW / Hwy 403 Local Corridor ➔ Dorval Dr";
    returnHighway = isBramptonDest
      ? "Steeles Ave E ➔ Hwy 410 / Hwy 401 Local Corridor"
      : "Dorval Dr ➔ QEW / Hwy 403 Local Corridor";
  } else if (!norm.includes("ottawa")) {
    // North America generic custom city / ZIP / postal code heuristic
    const isLongHaul =
      norm.includes("sudbury") ||
      norm.includes("north bay") ||
      norm.includes("windsor") ||
      norm.includes("detroit") ||
      norm.includes("quebec") ||
      norm.includes("boston") ||
      norm.includes("new york") ||
      norm.includes("chicago") ||
      norm.includes("cleveland") ||
      norm.includes("pittsburgh") ||
      /^\d{5}/.test(norm);
    durationMinutes = isLongHaul ? 260 : 170;
    distanceKm = isLongHaul ? 430 : 275;
    outboundHighway = `${userOrigin} Express Corridor ➔ Hwy 401 (${destinationCity})`;
    returnHighway = `Hwy 401 (${destinationCity}) ➔ ${userOrigin} Express Corridor`;
  }

  const durationHours = durationMinutes / 60;
  let stops: CorridorStop[] = [];

  if (durationHours >= 3.5) {
    if (direction === "to_tournament") {
      // Outbound: Stop 1 @ ~48% (Kingston ~2h 10m), Stop 2 @ ~75% (Port Hope ~3h 25m)
      const stop1Elapsed = Math.round((durationMinutes * 0.48) / 5) * 5;
      const stop2Elapsed = Math.round((durationMinutes * 0.75) / 5) * 5;
      const s1Addr = "1200 Division St, Kingston, ON K7K 6X4";
      const s2Addr = "Port Hope ONroute Westbound, Hwy 401, Port Hope, ON";
      stops = [
        {
          id: "corridor-stop-outbound-1",
          title: "Kingston — Division St Hub (Hwy 401 Exit 617)",
          highwayExit: "Hwy 401 Exit 617",
          elapsedDriveLabel: `${formatDurationMinutes(stop1Elapsed)} into drive • Halfway Point`,
          milestoneTag: "50% • Halfway Meal Stop",
          fuelAndCoffeeOptions: "Chipotle, Panera Bread, Starbucks, Shell Gas, Clean Restrooms",
          addressQuery: s1Addr,
          googleMapsUrl: getGoogleMapsDeepLink(s1Addr),
        },
        {
          id: "corridor-stop-outbound-2",
          title: "Port Hope ONroute / Cobourg (Hwy 401 Exit 472)",
          highwayExit: "Hwy 401 Exit 472",
          elapsedDriveLabel: `${formatDurationMinutes(stop2Elapsed)} into drive • 75% Mark`,
          milestoneTag: "75% • Quick Stretch / Coffee",
          fuelAndCoffeeOptions: "Starbucks, Tim Hortons, Pur & Simple, Esso / Canadian Tire Gas, Clean Restrooms",
          addressQuery: s2Addr,
          googleMapsUrl: getGoogleMapsDeepLink(s2Addr),
        },
      ];
    } else {
      // Return Trip Home (Reverse chronological order & recalculated elapsed times):
      // Stop 1 @ ~1h 15m (Port Hope / Cobourg), Stop 2 @ ~2h 20m (Kingston Division St Hub)
      const stop1Elapsed = Math.max(65, Math.round((durationMinutes * 0.28) / 5) * 5); // ~1h 15m for 4h 30m drive
      const stop2Elapsed = Math.max(130, Math.round((durationMinutes * 0.52) / 5) * 5); // ~2h 20m for 4h 30m drive
      const s1Addr = "Port Hope / Cobourg ONroute Eastbound, Hwy 401, Port Hope, ON";
      const s2Addr = "1200 Division St, Kingston, ON K7K 6X4";
      stops = [
        {
          id: "corridor-stop-home-1",
          title: "Port Hope / Cobourg Hub (Hwy 401 Exit 472 Eastbound)",
          highwayExit: "Hwy 401 Exit 472",
          elapsedDriveLabel: `${formatDurationMinutes(stop1Elapsed)} into drive • Post-GTA Clearout`,
          milestoneTag: "Stop 1 • Post-GTA Coffee & Fuel",
          fuelAndCoffeeOptions: "Starbucks, Tim Hortons, Subway, Esso / Petro-Canada, Clean Restrooms",
          addressQuery: s1Addr,
          googleMapsUrl: getGoogleMapsDeepLink(s1Addr),
        },
        {
          id: "corridor-stop-home-2",
          title: "Kingston — Division St Hub (Hwy 401 Exit 617)",
          highwayExit: "Hwy 401 Exit 617",
          elapsedDriveLabel: `${formatDurationMinutes(stop2Elapsed)} into drive • Halfway Recovery Meal`,
          milestoneTag: "Stop 2 • Halfway Team Recovery Dinner",
          fuelAndCoffeeOptions: "Chipotle, Panera Bread, Starbucks, Harper's Burger Bar, Shell Gas, Clean Restrooms",
          addressQuery: s2Addr,
          googleMapsUrl: getGoogleMapsDeepLink(s2Addr),
        },
      ];
    }
  } else if (durationHours >= 2) {
    const halfwayMins = Math.round((durationMinutes * 0.5) / 5) * 5;
    const stopAddr = `Port Hope / Bowmanville Hwy 401 Exit 464, ON`;
    stops = [
      {
        id: `corridor-stop-mid-${direction}`,
        title: `Port Hope / Bowmanville Hub (Hwy 401 Exit 464)`,
        highwayExit: "Hwy 401 Exit 464",
        elapsedDriveLabel: `${formatDurationMinutes(halfwayMins)} into drive • Halfway Point`,
        milestoneTag: "50% • Primary Halfway Stop",
        fuelAndCoffeeOptions: "Starbucks, Panera Bread, Booster Juice, Tim Hortons, Shell Gas, Clean Restrooms",
        addressQuery: stopAddr,
        googleMapsUrl: getGoogleMapsDeepLink(stopAddr),
      },
    ];
  } else {
    const quickMins = Math.max(15, Math.round((durationMinutes * 0.5) / 5) * 5);
    const stopAddr = isBramptonDest
      ? "Orion Gate Plaza, Steeles Ave E & Hwy 410, Brampton, ON"
      : "Dorval Crossing, Dorval Dr & QEW, Oakville, ON";
    stops = [
      {
        id: `corridor-stop-quick-${direction}`,
        title: isBramptonDest
          ? "Brampton — Orion Gate / Steeles Ave Hub (Hwy 410 Exit)"
          : "Oakville — Dorval Crossing Plaza (QEW Exit 118)",
        highwayExit: isBramptonDest ? "Hwy 410 Exit (Steeles Ave E)" : "QEW Exit 118 (Dorval Dr)",
        elapsedDriveLabel: `${formatDurationMinutes(quickMins)} into drive • Quick Fuel & Coffee`,
        milestoneTag: "Optional Quick Stop",
        fuelAndCoffeeOptions: isBramptonDest
          ? "Tim Hortons, Starbucks, Freshii, Osmow's, Esso Gas, Clean Restrooms"
          : "Tim Hortons, Freshii, Tribeca Coffee, Booster Juice, Petro-Canada, Clean Restrooms",
        addressQuery: stopAddr,
        googleMapsUrl: getGoogleMapsDeepLink(stopAddr),
      },
    ];
  }

  const pitStopBufferMins = durationHours >= 3.5 ? 30 : durationHours >= 2 ? 20 : 10;
  const destAddr = options.destinationAddress || destinationCity;
  const destinationMapsUrl = getGoogleMapsSearchUrl(destAddr);

  if (direction === "trip_home") {
    const finalTipOff = options.finalGameTipOffMinutes ?? 870; // Default 2:30 PM Sunday
    const finalDay = options.finalGameDayLabel || "Sun, Oct 25";
    const finalVenueName = options.finalGameVenue || destinationVenue;
    const returnDepartMins = finalTipOff + 75 + 30;
    const estHomeArrivalMins = returnDepartMins + durationMinutes + pitStopBufferMins;

    return {
      direction,
      origin: `${destinationCity} (${finalVenueName})`,
      destination: userOrigin,
      destinationVenue: `${userOrigin} (Home Base)`,
      destinationAddress: userOrigin,
      destinationMapsUrl: getGoogleMapsDeepLink(userOrigin),
      highwayRouteSummary: returnHighway,
      distanceKm,
      durationMinutes,
      durationLabel: `~${formatDurationMinutes(durationMinutes)}`,
      recommendedDepartureTitle: "Recommended Return Departure",
      recommendedDepartureLabel: options.schedulePending
        ? `Post-Finale (${finalDay})`
        : `${formatClockFromMinutes(returnDepartMins)} (${finalDay})`,
      departureContextNote: options.schedulePending
        ? `Return route locked via ${returnHighway} • Final departure time updates automatically once bracket tip-offs drop`
        : `Post-finale departure (Tip + 75m game + 30m buffer) • Est. Home ETA ~${formatClockFromMinutes(estHomeArrivalMins)}`,
      stops,
    };
  }

  const recommendedDepartureMinutes = firstEventArrivalMinutes - durationMinutes - pitStopBufferMins;
  const recommendedDepartureLabel = options.schedulePending
    ? `Target 3:00 PM Check-In (${firstEventDayLabel})`
    : `${formatClockFromMinutes(recommendedDepartureMinutes)} (${firstEventDayLabel})`;

  return {
    direction,
    origin: userOrigin,
    destination: destinationCity,
    destinationVenue,
    destinationAddress: destAddr,
    destinationMapsUrl,
    highwayRouteSummary: outboundHighway,
    distanceKm,
    durationMinutes,
    durationLabel: `~${formatDurationMinutes(durationMinutes)}`,
    recommendedDepartureTitle: options.schedulePending
      ? "Hotel Base Camp Check-In Target"
      : "Recommended Departure Call",
    recommendedDepartureLabel,
    departureContextNote: options.schedulePending
      ? `Route locked to ${destinationVenue} (${destAddr}) • Includes ${pitStopBufferMins}m Hwy 401 pit-stop buffer`
      : `Includes ${pitStopBufferMins}m pit-stop buffer to make ${formatClockFromMinutes(firstEventArrivalMinutes)} arrival call`,
    stops,
  };
}
