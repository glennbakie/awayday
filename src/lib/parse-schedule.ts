export interface MergeableGame {
  day?: string;
  dayLabel?: string;
  dateStr?: string;
  tipOff?: string;
  tipOffMinutes?: number;
  arrivalCall?: string;
  court?: string;
  venueName?: string;
  venueAddress?: string;
  city?: string;
  opponent?: string;
  jerseyColor?: string;
  telemetryTag?: string;
  gameNumber?: number;
  isPlaceholder?: boolean;
  [key: string]: any;
}

const MONTH_MAP: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export function parseSortableDateValue(dateStr?: string, day?: string): number {
  const ds = (dateStr || "").trim();
  const isoMatch = ds.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return (
      parseInt(isoMatch[1], 10) * 10000 +
      parseInt(isoMatch[2], 10) * 100 +
      parseInt(isoMatch[3], 10)
    );
  }
  const combined = `${day || ""} ${ds}`.toLowerCase();
  const mdMatch = combined.match(
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})/i
  );
  if (mdMatch) {
    const month = MONTH_MAP[mdMatch[1].slice(0, 3).toLowerCase()] || 11;
    const dayNum = parseInt(mdMatch[2], 10);
    const yearMatch = combined.match(/\b(20\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : 2026;
    return year * 10000 + month * 100 + dayNum;
  }
  if (/fri/i.test(combined)) return 99990005;
  if (/sat/i.test(combined)) return 99990006;
  if (/sun/i.test(combined)) return 99990007;
  if (/mon/i.test(combined)) return 99990008;
  return Number.MAX_SAFE_INTEGER;
}

export function parseSortableTimeMinutes(tipOff?: string, tipOffMinutes?: number): number {
  if (typeof tipOffMinutes === "number" && !Number.isNaN(tipOffMinutes)) {
    return tipOffMinutes;
  }
  const raw = (tipOff || "").trim();
  if (!raw || /tbd|pending/i.test(raw)) return Number.MAX_SAFE_INTEGER;
  if (/noon/i.test(raw)) return 720;
  const match = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const mer = (match[3] || "").toUpperCase();
  if (mer === "PM" && h < 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

export function sortGamesChronologically<T extends MergeableGame>(games: T[]): T[] {
  const sorted = [...games].sort((a, b) => {
    const dateA = parseSortableDateValue(a.dateStr, a.dayLabel || a.day);
    const dateB = parseSortableDateValue(b.dateStr, b.dayLabel || b.day);
    if (dateA !== dateB) return dateA - dateB;
    const timeA = parseSortableTimeMinutes(a.tipOff, a.tipOffMinutes);
    const timeB = parseSortableTimeMinutes(b.tipOff, b.tipOffMinutes);
    return timeA - timeB;
  });
  return sorted.map((g, idx) => ({
    ...g,
    gameNumber: idx + 1,
  }));
}

const KNOWN_ONTARIO_CITIES: Array<{ pattern: RegExp; city: string }> = [
  { pattern: /\bmississauga\b|rick\s*hansen|meadowvale|port\s*credit|streetsville|erin\s*mills/i, city: "Mississauga, ON" },
  { pattern: /\bbrampton\b|central\s*peel|heart\s*lake|sandalwood|chinguacousy|mayfield|st\.?\s*roch|fletcher'?s\s*meadow/i, city: "Brampton, ON" },
  { pattern: /\boakville\b|st\.?\s*thomas\s*aquinas|iroquois\s*ridge|garth\s*webb|abbey\s*park/i, city: "Oakville, ON" },
  { pattern: /\bburlington\b|corpus\s*christi|aldershot|haber\s*rec/i, city: "Burlington, ON" },
  { pattern: /\btoronto\b|hoopdome|downsview|pan\s*am\s*cent|york\s*university/i, city: "Toronto, ON" },
  { pattern: /\betobicoke\b/i, city: "Etobicoke, ON" },
  { pattern: /\bnorth\s*york\b/i, city: "North York, ON" },
  { pattern: /\bscarborough\b/i, city: "Scarborough, ON" },
  { pattern: /\bvaughan\b|woodbridge/i, city: "Vaughan, ON" },
  { pattern: /\bmarkham\b|bill\s*crothers|unionville/i, city: "Markham, ON" },
  { pattern: /\brichmond\s*hill\b/i, city: "Richmond Hill, ON" },
  { pattern: /\bwaterloo\b|rim\s*park|wilfrid\s*laurier/i, city: "Waterloo, ON" },
  { pattern: /\bkitchener\b|activa/i, city: "Kitchener, ON" },
  { pattern: /\bhamilton\b|mcmaster/i, city: "Hamilton, ON" },
  { pattern: /\blondon\b/i, city: "London, ON" },
  { pattern: /\bottawa\b|carleton\s*univ/i, city: "Ottawa, ON" },
  { pattern: /\bguelph\b/i, city: "Guelph, ON" },
  { pattern: /\bmilton\b/i, city: "Milton, ON" },
  { pattern: /\bwhitby\b/i, city: "Whitby, ON" },
  { pattern: /\boshawa\b/i, city: "Oshawa, ON" },
  { pattern: /\bajax\b/i, city: "Ajax, ON" },
  { pattern: /\bpickering\b/i, city: "Pickering, ON" },
  { pattern: /\bkingston\b/i, city: "Kingston, ON" },
  { pattern: /\bbarrie\b/i, city: "Barrie, ON" },
];

export function resolveVenueCity(
  venueName?: string,
  venueAddress?: string,
  fallbackCity = "Brampton, ON"
): string {
  const addr = (venueAddress || "").trim();
  const vName = (venueName || "").trim();

  // 1. Check venueAddress first so explicit street/city wins
  for (const entry of KNOWN_ONTARIO_CITIES) {
    if (entry.pattern.test(addr)) return entry.city;
  }
  const explicitAddrCity = addr.match(/,\s*([A-Za-z\s]+),\s*(?:ON|QC|AB|BC|[A-Z]{2})\b/);
  if (explicitAddrCity?.[1]) {
    return `${explicitAddrCity[1].trim()}, ON`;
  }

  // 2. Check venueName (e.g., "Mississauga Secondary School", "Central Peel Secondary School")
  for (const entry of KNOWN_ONTARIO_CITIES) {
    if (entry.pattern.test(vName)) return entry.city;
  }

  return fallbackCity || "Brampton, ON";
}

export function normalizeOpponentName(raw?: string): string {
  return (raw || "")
    .trim()
    .toLowerCase()
    .replace(/^(?:vs\.?|versus|at|@)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isUnknownOrTbdOpponent(raw?: string): boolean {
  const norm = normalizeOpponentName(raw);
  if (!norm) return true;
  return /^(tbd|unknown|opponent\s*tbd|opponent\s*\d*|game\s*\d+\s*-\s*tbd.*|tip-?off\s*pending|schedule\s*pending)$/i.test(
    norm
  );
}

export function normalizeDateKey(dateStr?: string, day?: string): string {
  const ds = (dateStr || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(ds)) {
    return ds;
  }
  const rawDay = (day || ds || "").trim().toLowerCase();
  const monthDay = rawDay.match(
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}/i
  );
  if (monthDay) {
    return monthDay[0].toLowerCase().replace(/\s+/g, " ");
  }
  return rawDay.replace(/\s+/g, " ");
}

export function normalizeTimeKey(tipOff?: string): string {
  const raw = (tipOff || "").trim();
  const match = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const mer = (match[3] || "").toUpperCase();
    if (mer === "PM" && h < 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return String(h * 60 + m);
  }
  if (/noon/i.test(raw)) return "720";
  return raw.toLowerCase().replace(/\s+/g, " ");
}

function isTbdField(val?: string): boolean {
  const v = (val || "").trim();
  return !v || /^(tbd|unknown|n\/a|pending)$/i.test(v);
}

function pickRicherString(a?: string, b?: string): string | undefined {
  const aTbd = isTbdField(a);
  const bTbd = isTbdField(b);
  if (aTbd && !bTbd) return b;
  if (!aTbd && bTbd) return a;
  if (!a) return b;
  if (!b) return a;
  return b.trim().length > a.trim().length ? b : a;
}

function mergeTwoGames<T extends MergeableGame>(existing: T, incoming: T): T {
  return {
    ...existing,
    day: pickRicherString(existing.day, incoming.day),
    dateStr: pickRicherString(existing.dateStr, incoming.dateStr),
    tipOff: pickRicherString(existing.tipOff, incoming.tipOff),
    arrivalCall: pickRicherString(existing.arrivalCall, incoming.arrivalCall),
    court: pickRicherString(existing.court, incoming.court),
    venueName: pickRicherString(existing.venueName, incoming.venueName),
    venueAddress: pickRicherString(existing.venueAddress, incoming.venueAddress),
    opponent: pickRicherString(existing.opponent, incoming.opponent),
    jerseyColor: pickRicherString(existing.jerseyColor, incoming.jerseyColor),
    telemetryTag: existing.telemetryTag || incoming.telemetryTag,
    isPlaceholder: Boolean(existing.isPlaceholder && incoming.isPlaceholder),
  };
}

/**
 * Merges and deduplicates games extracted across multiple screenshots/batches:
 * 1. Discards chat-announcement/placeholder TBD entries when named games exist.
 * 2. Discards TBD-opponent entries that collide with a named game at the same date + startTime.
 * 3. Merges duplicate screenshots of the same game (same normalized date + startTime + opponent),
 *    preserving the richest venue, court, uniform, and arrival fields.
 */
export function mergeAndDedupeGames<T extends MergeableGame>(games: T[]): T[] {
  const hasAnyNamedGame = games.some(
    (g) => !g.isPlaceholder && !isUnknownOrTbdOpponent(g.opponent) && !/tbd|pending/i.test(g.tipOff || "")
  );

  const filtered = hasAnyNamedGame
    ? games.filter((g) => !g.isPlaceholder && !isUnknownOrTbdOpponent(g.opponent))
    : games;

  // Track named-game time slots (date + startTime) for time-slot collision checks
  const namedTimeSlots = new Set<string>();
  for (const g of filtered) {
    if (!isUnknownOrTbdOpponent(g.opponent)) {
      const slot = `${normalizeDateKey(g.dateStr, g.day)}|${normalizeTimeKey(g.tipOff)}`;
      namedTimeSlots.add(slot);
    }
  }

  const byKey = new Map<string, T>();
  const orderedKeys: string[] = [];

  for (const g of filtered) {
    const dateKey = normalizeDateKey(g.dateStr, g.day);
    const timeKey = normalizeTimeKey(g.tipOff);
    const oppKey = normalizeOpponentName(g.opponent);
    const slotKey = `${dateKey}|${timeKey}`;

    // Discard generic TBD entry if a named game exists at that exact date + startTime
    if (isUnknownOrTbdOpponent(g.opponent) && namedTimeSlots.has(slotKey)) {
      continue;
    }

    const dedupeKey = `${dateKey}|${timeKey}|${oppKey}`;
    const existing = byKey.get(dedupeKey);
    if (existing) {
      byKey.set(dedupeKey, mergeTwoGames(existing, g));
    } else {
      byKey.set(dedupeKey, g);
      orderedKeys.push(dedupeKey);
    }
  }

  const deduped = orderedKeys.map((k) => byKey.get(k)!);
  return sortGamesChronologically(deduped);
}

export const dedupeAndCleanGames = mergeAndDedupeGames;

/**
 * Downscales an image File on a <canvas> to max dimension 1100px (JPEG, quality 0.78)
 * to shrink payload size by ~85% while keeping schedule text crisp.
 * Non-image files (e.g. PDFs) are returned unchanged.
 */
export async function compressImageForVision(
  file: File,
  maxDim = 1100,
  quality = 0.78
): Promise<File> {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return file;
  }
  const lowerName = (file.name || "").toLowerCase();
  const isImage =
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|webp|heic)$/i.test(lowerName);
  if (!isImage || file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
    return file;
  }

  return new Promise<File>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (!width || !height) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }
        const longest = Math.max(width, height);
        if (longest > maxDim) {
          const scale = maxDim / longest;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanBase = (file.name || "schedule").replace(/\.[^.]+$/, "");
            resolve(
              new File([blob], `${cleanBase}.jpg`, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
            );
          },
          "image/jpeg",
          quality
        );
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });
}
