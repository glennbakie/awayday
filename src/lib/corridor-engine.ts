export type CorridorDirection = "to_tournament" | "trip_home";

export interface CorridorStop {
  id: string;
  title: string;
  highwayExit: string;
  elapsedDriveLabel: string;
  milestoneTag: string;
  fuelAndCoffeeOptions: string;
  addressQuery: string;
  appleMapsUrl: string;
  googleMapsUrl: string;
}

export interface TravelCorridorPlan {
  direction: CorridorDirection;
  origin: string;
  destination: string;
  destinationVenue: string;
  highwayRouteSummary: string;
  distanceKm: number;
  durationMinutes: number;
  durationLabel: string;
  recommendedDepartureTitle: string;
  recommendedDepartureLabel: string;
  departureContextNote: string;
  stops: CorridorStop[];
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

export function getAppleMapsDeepLink(address: string): string {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`;
}

export function getGoogleMapsDeepLink(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
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

  let durationMinutes = 270; // 4h 30m default (Ottawa <-> Oakville)
  let distanceKm = 445;
  let outboundHighway = "Hwy 416 S ➔ Hwy 401 W ➔ Hwy 403 W";
  let returnHighway = "Hwy 403 E ➔ Hwy 401 E ➔ Hwy 416 N";

  if (norm.includes("kanata") || norm.includes("west") || norm.includes("stittsville") || norm.includes("nepean") || /^k2/i.test(norm)) {
    durationMinutes = 255; // 4h 15m
    distanceKm = 425;
    outboundHighway = "Hwy 7 W / Hwy 416 S ➔ Hwy 401 W ➔ Hwy 403 W";
    returnHighway = "Hwy 403 E ➔ Hwy 401 E ➔ Hwy 416 N / Hwy 7 E";
  } else if (norm.includes("orleans") || norm.includes("orléans") || norm.includes("east") || norm.includes("gatineau") || /^k1|^k4|^j8/i.test(norm)) {
    durationMinutes = 285; // 4h 45m
    distanceKm = 465;
    outboundHighway = "Hwy 417 W ➔ Hwy 416 S ➔ Hwy 401 W ➔ Hwy 403 W";
    returnHighway = "Hwy 403 E ➔ Hwy 401 E ➔ Hwy 416 N ➔ Hwy 417 E";
  } else if (norm.includes("montreal") || norm.includes("montréal") || norm.includes("laval") || norm.includes("brossard") || /^h[1-9]/i.test(norm)) {
    durationMinutes = 340; // 5h 40m
    distanceKm = 575;
    outboundHighway = "A-20 O ➔ Hwy 401 W ➔ Hwy 403 W";
    returnHighway = "Hwy 403 E ➔ Hwy 401 E ➔ A-20 E";
  } else if (norm.includes("kingston") || norm.includes("belleville") || norm.includes("brockville") || /^k7/i.test(norm)) {
    durationMinutes = 175; // 2h 55m
    distanceKm = 290;
    outboundHighway = "Hwy 401 W ➔ Hwy 407 / Hwy 403 W";
    returnHighway = "Hwy 403 E / Hwy 407 ➔ Hwy 401 E";
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
    outboundHighway = "Regional Corridor ➔ Hwy 401 / Hwy 403 / QEW";
    returnHighway = "QEW / Hwy 403 / Hwy 401 ➔ Regional Corridor";
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
    durationMinutes = 35; // < 2 hours local/regional window
    distanceKm = 38;
    outboundHighway = "QEW / Hwy 403 Local Corridor ➔ Dorval Dr";
    returnHighway = "Dorval Dr ➔ QEW / Hwy 403 Local Corridor";
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
    outboundHighway = `${userOrigin} Express Corridor ➔ Hwy 401 / QEW (${destinationCity})`;
    returnHighway = `QEW / Hwy 401 (${destinationCity}) ➔ ${userOrigin} Express Corridor`;
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
          appleMapsUrl: getAppleMapsDeepLink(s1Addr),
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
          appleMapsUrl: getAppleMapsDeepLink(s2Addr),
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
          appleMapsUrl: getAppleMapsDeepLink(s1Addr),
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
          appleMapsUrl: getAppleMapsDeepLink(s2Addr),
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
        appleMapsUrl: getAppleMapsDeepLink(stopAddr),
        googleMapsUrl: getGoogleMapsDeepLink(stopAddr),
      },
    ];
  } else {
    const quickMins = Math.max(15, Math.round((durationMinutes * 0.5) / 5) * 5);
    const stopAddr = "Dorval Crossing, Dorval Dr & QEW, Oakville, ON";
    stops = [
      {
        id: `corridor-stop-quick-${direction}`,
        title: "Oakville — Dorval Crossing Plaza (QEW Exit 118)",
        highwayExit: "QEW Exit 118 (Dorval Dr)",
        elapsedDriveLabel: `${formatDurationMinutes(quickMins)} into drive • Quick Fuel & Coffee`,
        milestoneTag: "Optional Quick Stop",
        fuelAndCoffeeOptions: "Tim Hortons, Freshii, Tribeca Coffee, Booster Juice, Petro-Canada, Clean Restrooms",
        addressQuery: stopAddr,
        appleMapsUrl: getAppleMapsDeepLink(stopAddr),
        googleMapsUrl: getGoogleMapsDeepLink(stopAddr),
      },
    ];
  }

  const pitStopBufferMins = durationHours >= 3.5 ? 30 : durationHours >= 2 ? 20 : 10;

  if (direction === "trip_home") {
    // Sunday Recommended Return Departure based on final game's estimated completion time:
    // final game tipOff + 75m game duration + 30m post-game/locker buffer
    const finalTipOff = options.finalGameTipOffMinutes ?? 870; // Default 2:30 PM Sunday
    const finalDay = options.finalGameDayLabel || "Sun, Oct 25";
    const finalVenueName = options.finalGameVenue || destinationVenue;
    const returnDepartMins = finalTipOff + 75 + 30; // e.g. 2:30 PM + 75m (3:45 PM) + 30m = 4:15 PM
    const estHomeArrivalMins = returnDepartMins + durationMinutes + pitStopBufferMins;

    return {
      direction,
      origin: `${destinationCity} (${finalVenueName})`,
      destination: userOrigin,
      destinationVenue: `${userOrigin} (Home Base)`,
      highwayRouteSummary: returnHighway,
      distanceKm,
      durationMinutes,
      durationLabel: `~${formatDurationMinutes(durationMinutes)}`,
      recommendedDepartureTitle: "Recommended Return Departure",
      recommendedDepartureLabel: `${formatClockFromMinutes(returnDepartMins)} (${finalDay})`,
      departureContextNote: `Post-finale departure (Tip + 75m game + 30m buffer) • Est. Home ETA ~${formatClockFromMinutes(estHomeArrivalMins)}`,
      stops,
    };
  }

  const recommendedDepartureMinutes = firstEventArrivalMinutes - durationMinutes - pitStopBufferMins;
  const recommendedDepartureLabel = `${formatClockFromMinutes(recommendedDepartureMinutes)} (${firstEventDayLabel})`;

  return {
    direction,
    origin: userOrigin,
    destination: destinationCity,
    destinationVenue,
    highwayRouteSummary: outboundHighway,
    distanceKm,
    durationMinutes,
    durationLabel: `~${formatDurationMinutes(durationMinutes)}`,
    recommendedDepartureTitle: "Recommended Departure Call",
    recommendedDepartureLabel,
    departureContextNote: `Includes ${pitStopBufferMins}m pit-stop buffer to make ${formatClockFromMinutes(firstEventArrivalMinutes)} arrival call`,
    stops,
  };
}
