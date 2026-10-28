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
  origin: string;
  destination: string;
  destinationVenue: string;
  highwayRouteSummary: string;
  distanceKm: number;
  durationMinutes: number;
  durationLabel: string;
  recommendedDepartureLabel: string;
  departureContextNote: string;
  stops: CorridorStop[];
}

export const CORRIDOR_ORIGIN_PRESETS = [
  "Ottawa, ON",
  "Kanata / West End",
  "Orleans / East End",
  "Montreal, QC",
  "Toronto, ON",
  "Custom...",
] as const;

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

export function computeTravelCorridor(
  rawOrigin: string,
  destinationCity = "Oakville, ON",
  destinationVenue = "Fairfield Inn Toronto Oakville",
  firstEventArrivalMinutes = 915, // Default 3:15 PM arrival call for 3:45 PM Game 1
  firstEventDayLabel = "Sat, Oct 24"
): TravelCorridorPlan {
  const origin = (rawOrigin || "Ottawa, ON").trim() || "Ottawa, ON";
  const norm = origin.toLowerCase();

  let durationMinutes = 270; // 4h 30m default (Ottawa -> Oakville)
  let distanceKm = 445;
  let highwayRouteSummary = "Hwy 416 S ➔ Hwy 401 W ➔ Hwy 403 W";

  if (norm.includes("kanata") || norm.includes("west end") || norm.includes("stittsville") || norm.includes("nepean")) {
    durationMinutes = 255; // 4h 15m (~4.25h >= 3.5h)
    distanceKm = 425;
    highwayRouteSummary = "Hwy 7 W / Hwy 416 S ➔ Hwy 401 W ➔ Hwy 403 W";
  } else if (norm.includes("orleans") || norm.includes("orléans") || norm.includes("east end") || norm.includes("gatineau")) {
    durationMinutes = 285; // 4h 45m
    distanceKm = 465;
    highwayRouteSummary = "Hwy 417 W ➔ Hwy 416 S ➔ Hwy 401 W ➔ Hwy 403 W";
  } else if (norm.includes("montreal") || norm.includes("montréal") || norm.includes("laval") || norm.includes("brossard")) {
    durationMinutes = 340; // 5h 40m
    distanceKm = 575;
    highwayRouteSummary = "A-20 O ➔ Hwy 401 W ➔ Hwy 403 W";
  } else if (norm.includes("kingston") || norm.includes("belleville") || norm.includes("brockville")) {
    durationMinutes = 175; // 2h 55m (2 to 3.5 hours window)
    distanceKm = 290;
    highwayRouteSummary = "Hwy 401 W ➔ Hwy 407 / Hwy 403 W";
  } else if (norm.includes("peterborough") || norm.includes("oshawa") || norm.includes("barrie") || norm.includes("london") || norm.includes("kitchener") || norm.includes("waterloo")) {
    durationMinutes = 130; // 2h 10m (2 to 3.5 hours window)
    distanceKm = 185;
    highwayRouteSummary = "Hwy 401 / Hwy 407 E/W ➔ QEW / Hwy 403";
  } else if (
    norm.includes("toronto") ||
    norm.includes("mississauga") ||
    norm.includes("brampton") ||
    norm.includes("hamilton") ||
    norm.includes("burlington") ||
    norm.includes("markham") ||
    norm.includes("vaughan")
  ) {
    durationMinutes = 45; // < 2 hours window
    distanceKm = 52;
    highwayRouteSummary = "Gardiner Expy W / QEW W ➔ Dorval Dr";
  } else if (!norm.includes("ottawa")) {
    // Generic custom city heuristic: deterministic 3h 00m (2 to 3.5 hours) or 3h 50m if far
    const isLongHaul =
      norm.includes("sudbury") ||
      norm.includes("north bay") ||
      norm.includes("windsor") ||
      norm.includes("quebec") ||
      norm.includes("cornwall");
    durationMinutes = isLongHaul ? 245 : 165;
    distanceKm = isLongHaul ? 410 : 265;
    highwayRouteSummary = `Primary Provincial Corridor ➔ Hwy 401 / QEW (${destinationCity})`;
  }

  const durationHours = durationMinutes / 60;
  let stops: CorridorStop[] = [];

  if (durationHours >= 3.5) {
    // >= 3.5 hours: 2 strategic stops (Halfway Meal Stop @ ~50% distance, Quick Stretch / Coffee @ ~75% distance)
    const stop1Elapsed = Math.round((durationMinutes * 0.48) / 5) * 5;
    const stop2Elapsed = Math.round((durationMinutes * 0.75) / 5) * 5;

    if (norm.includes("montreal") || norm.includes("montréal") || norm.includes("laval")) {
      const s1Addr = "Division St & Hwy 401 Exit 617, Kingston, ON";
      const s2Addr = "Port Hope ONroute, Hwy 401 Westbound, Port Hope, ON";
      stops = [
        {
          id: "corridor-stop-1",
          title: "Kingston — Division St Hub (Hwy 401 Exit 617)",
          highwayExit: "Hwy 401 Exit 617",
          elapsedDriveLabel: `${formatDurationMinutes(stop1Elapsed)} into drive • Halfway Point`,
          milestoneTag: "50% • Halfway Meal Stop",
          fuelAndCoffeeOptions: "Chipotle, Panera Bread, Starbucks, Harper's Burger Bar, Shell Gas, Clean Restrooms",
          addressQuery: s1Addr,
          appleMapsUrl: getAppleMapsDeepLink(s1Addr),
          googleMapsUrl: getGoogleMapsDeepLink(s1Addr),
        },
        {
          id: "corridor-stop-2",
          title: "Port Hope / Cobourg Hub (Hwy 401 Exit 464)",
          highwayExit: "Hwy 401 Exit 464",
          elapsedDriveLabel: `${formatDurationMinutes(stop2Elapsed)} into drive • Pre-GTA Stretch`,
          milestoneTag: "75% • Quick Stretch & Coffee",
          fuelAndCoffeeOptions: "Starbucks, Tim Hortons, Subway, Petro-Canada EV & Fuel, Rest Area",
          addressQuery: s2Addr,
          appleMapsUrl: getAppleMapsDeepLink(s2Addr),
          googleMapsUrl: getGoogleMapsDeepLink(s2Addr),
        },
      ];
    } else {
      const s1Addr = "1200 Division St, Kingston, ON K7K 6X4";
      const s2Addr = "Port Hope ONroute Westbound, Hwy 401, Port Hope, ON";
      stops = [
        {
          id: "corridor-stop-1",
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
          id: "corridor-stop-2",
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
    }
  } else if (durationHours >= 2) {
    // 2 to 3.5 hours: 1 primary halfway stop
    const halfwayMins = Math.round((durationMinutes * 0.5) / 5) * 5;
    const stopAddr = `Port Hope ONroute Westbound, Hwy 401, Port Hope, ON`;
    stops = [
      {
        id: "corridor-stop-halfway",
        title: "Port Hope / Bowmanville Hub (Hwy 401 Exit 464)",
        highwayExit: "Hwy 401 Exit 464",
        elapsedDriveLabel: `${formatDurationMinutes(halfwayMins)} into drive • Halfway Point`,
        milestoneTag: "50% • Primary Halfway Stop",
        fuelAndCoffeeOptions: "Starbucks, Panera Bread,Booster Juice, Tim Hortons, Shell Gas, Clean Restrooms",
        addressQuery: stopAddr,
        appleMapsUrl: getAppleMapsDeepLink(stopAddr),
        googleMapsUrl: getGoogleMapsDeepLink(stopAddr),
      },
    ];
  } else {
    // < 2 hours: 1 optional quick stop
    const quickMins = Math.max(15, Math.round((durationMinutes * 0.55) / 5) * 5);
    const stopAddr = "Dorval Crossing, Dorval Dr & QEW, Oakville, ON";
    stops = [
      {
        id: "corridor-stop-quick",
        title: "Oakville — Dorval Crossing Plaza (QEW Exit 118)",
        highwayExit: "QEW Exit 118 (Dorval Dr)",
        elapsedDriveLabel: `${formatDurationMinutes(quickMins)} into drive • Pre-Gym Arrival Stop`,
        milestoneTag: "Optional Quick Stop",
        fuelAndCoffeeOptions: "Tim Hortons, Freshii, Tribeca Coffee, Booster Juice, Petro-Canada, Clean Restrooms",
        addressQuery: stopAddr,
        appleMapsUrl: getAppleMapsDeepLink(stopAddr),
        googleMapsUrl: getGoogleMapsDeepLink(stopAddr),
      },
    ];
  }

  // Compute Recommended Departure Call:
  // Factor in total drive duration + pit stop buffer (30m if >= 3.5h, 20m if 2-3.5h, 10m if < 2h) before first event arrival call
  const pitStopBufferMins = durationHours >= 3.5 ? 30 : durationHours >= 2 ? 20 : 10;
  const recommendedDepartureMinutes = firstEventArrivalMinutes - durationMinutes - pitStopBufferMins;
  const recommendedDepartureLabel = `${formatClockFromMinutes(recommendedDepartureMinutes)} (${firstEventDayLabel})`;

  return {
    origin,
    destination: destinationCity,
    destinationVenue,
    highwayRouteSummary,
    distanceKm,
    durationMinutes,
    durationLabel: `~${formatDurationMinutes(durationMinutes)}`,
    recommendedDepartureLabel,
    departureContextNote: `Includes ${pitStopBufferMins}m pit-stop buffer to make ${formatClockFromMinutes(firstEventArrivalMinutes)} arrival call`,
    stops,
  };
}
