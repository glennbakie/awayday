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
  { pattern: /\brenfrew\b|myfm\s*cent(?:re|er)|renfrew\s*collegiate|\brci\b/i, city: "Renfrew, ON" },
  { pattern: /\barnprior\b/i, city: "Arnprior, ON" },
  { pattern: /\bpembroke\b/i, city: "Pembroke, ON" },
  { pattern: /\bpetawawa\b/i, city: "Petawawa, ON" },
  { pattern: /\bcarleton\s*place\b/i, city: "Carleton Place, ON" },
  { pattern: /\bsmiths\s*falls\b/i, city: "Smiths Falls, ON" },
  { pattern: /\bperth\b/i, city: "Perth, ON" },
  { pattern: /\bkemptville\b/i, city: "Kemptville, ON" },
  { pattern: /\bcornwall\b/i, city: "Cornwall, ON" },
  { pattern: /\bbrockville\b/i, city: "Brockville, ON" },
  { pattern: /\bbelleville\b/i, city: "Belleville, ON" },
  { pattern: /\bpeterborough\b/i, city: "Peterborough, ON" },
  { pattern: /\borillia\b/i, city: "Orillia, ON" },
  { pattern: /\bguelph\b/i, city: "Guelph, ON" },
  { pattern: /\bsudbury\b/i, city: "Sudbury, ON" },
  { pattern: /\bnorth\s*bay\b/i, city: "North Bay, ON" },
  { pattern: /\bst\.?\s*catharines\b/i, city: "St. Catharines, ON" },
  { pattern: /\bbrantford\b/i, city: "Brantford, ON" },
  { pattern: /\bcambridge\b/i, city: "Cambridge, ON" },
];

export function resolveVenueCity(
  venueName?: string,
  venueAddress?: string,
  fallbackCity = ""
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

  return fallbackCity || "";
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

function pickPreferredString(a?: string, b?: string, preferIncoming = false): string | undefined {
  const aTbd = isTbdField(a);
  const bTbd = isTbdField(b);
  if (aTbd && !bTbd) return b;
  if (!aTbd && bTbd) return a;
  if (!a) return b;
  if (!b) return a;
  if (preferIncoming) return b;
  return b.trim().length > a.trim().length ? b : a;
}

function mergeTwoGames<T extends MergeableGame>(
  existing: T,
  incoming: T,
  preferIncoming = false
): T {
  return {
    ...existing,
    ...(preferIncoming ? incoming : {}),
    day: pickPreferredString(existing.day, incoming.day, preferIncoming),
    dayLabel: pickPreferredString(existing.dayLabel, incoming.dayLabel, preferIncoming),
    dateStr: pickPreferredString(existing.dateStr, incoming.dateStr, preferIncoming),
    tipOff: pickPreferredString(existing.tipOff, incoming.tipOff, preferIncoming),
    tipOffMinutes:
      preferIncoming && typeof incoming.tipOffMinutes === "number"
        ? incoming.tipOffMinutes
        : existing.tipOffMinutes ?? incoming.tipOffMinutes,
    arrivalCall: pickPreferredString(existing.arrivalCall, incoming.arrivalCall, preferIncoming),
    court: pickPreferredString(existing.court, incoming.court, preferIncoming),
    venueName: pickPreferredString(existing.venueName, incoming.venueName, preferIncoming),
    venueAddress: pickPreferredString(existing.venueAddress, incoming.venueAddress, preferIncoming),
    city: pickPreferredString(existing.city, incoming.city, preferIncoming),
    opponent: pickPreferredString(existing.opponent, incoming.opponent, preferIncoming),
    jerseyColor: pickPreferredString(existing.jerseyColor, incoming.jerseyColor, preferIncoming),
    telemetryTag: preferIncoming
      ? incoming.telemetryTag || existing.telemetryTag
      : existing.telemetryTag || incoming.telemetryTag,
    isPlaceholder: Boolean(existing.isPlaceholder && incoming.isPlaceholder),
  };
}

/**
 * Merges and deduplicates games extracted across multiple screenshots/batches or schedule updates:
 * 1. Discards chat-announcement/placeholder TBD entries when named games exist.
 * 2. Discards TBD-opponent entries that collide with a named game at the same date + startTime.
 * 3. Matches by (normalizedDate + normalizedOpponent) for named opponents (or date + time + opp)
 *    and merges into one record, preserving richest fields or preferring incoming updates.
 * 4. Sorts chronologically by (date ASC, startTime ASC) and assigns gameNumber 1..N.
 */
export function mergeAndDedupeGames<T extends MergeableGame>(
  games: T[],
  options?: { preferIncoming?: boolean }
): T[] {
  const preferIncoming = Boolean(options?.preferIncoming);
  const isPlayoffPlaceholder = (g: MergeableGame) =>
    Boolean(
      g.isPlaceholder &&
        /playoff|placement|round\s*robin|championship|seeding/i.test(
          `${g.opponent || ""} ${g.telemetryTag || ""} ${g.telemetryFlag || ""}`
        )
    );
  const hasAnyNamedGame = games.some(
    (g) => !g.isPlaceholder && !isUnknownOrTbdOpponent(g.opponent) && !/tbd|pending/i.test(g.tipOff || "")
  );

  const filtered = hasAnyNamedGame
    ? games.filter(
        (g) =>
          isPlayoffPlaceholder(g) ||
          (!g.isPlaceholder && !isUnknownOrTbdOpponent(g.opponent)) ||
          (preferIncoming && typeof g.gameNumber === "number" && !g.isPlaceholder)
      )
    : games;

  // Track named-game time slots (date + startTime) for time-slot collision checks
  const namedTimeSlots = new Set<string>();
  for (const g of filtered) {
    if (!isUnknownOrTbdOpponent(g.opponent)) {
      const slot = `${normalizeDateKey(g.dateStr, g.dayLabel || g.day)}|${normalizeTimeKey(
        g.tipOff || (typeof g.tipOffMinutes === "number" ? String(g.tipOffMinutes) : "")
      )}`;
      namedTimeSlots.add(slot);
    }
  }

  const byKey = new Map<string, T>();
  const orderedKeys: string[] = [];
  const keyByGameNumber = new Map<number, string>();
  const keyByTimeSlot = new Map<string, string>();

  for (const g of filtered) {
    const dateKey = normalizeDateKey(g.dateStr, g.dayLabel || g.day);
    const timeKey =
      typeof g.tipOffMinutes === "number" && !Number.isNaN(g.tipOffMinutes)
        ? String(g.tipOffMinutes)
        : normalizeTimeKey(g.tipOff);
    const oppKey = normalizeOpponentName(g.opponent);
    const slotKey = `${dateKey}|${timeKey}`;

    // Discard generic TBD entry if a named game exists at that exact date + startTime
    if (isUnknownOrTbdOpponent(g.opponent) && namedTimeSlots.has(slotKey) && !preferIncoming) {
      continue;
    }

    const dedupeKey = !isUnknownOrTbdOpponent(g.opponent)
      ? `${dateKey}|${oppKey}`
      : `${dateKey}|${timeKey}|${oppKey}`;

    let matchedKey: string | undefined = byKey.has(dedupeKey) ? dedupeKey : undefined;

    if (!matchedKey && preferIncoming) {
      if (typeof g.gameNumber === "number" && keyByGameNumber.has(g.gameNumber) && isUnknownOrTbdOpponent(g.opponent)) {
        matchedKey = keyByGameNumber.get(g.gameNumber);
      } else if (isUnknownOrTbdOpponent(g.opponent) && keyByTimeSlot.has(slotKey)) {
        matchedKey = keyByTimeSlot.get(slotKey);
      }
    }

    if (matchedKey && byKey.has(matchedKey)) {
      byKey.set(matchedKey, mergeTwoGames(byKey.get(matchedKey)!, g, preferIncoming));
    } else {
      byKey.set(dedupeKey, g);
      orderedKeys.push(dedupeKey);
      if (typeof g.gameNumber === "number") {
        keyByGameNumber.set(g.gameNumber, dedupeKey);
      }
      if (slotKey && !/|$/i.test(slotKey)) {
        keyByTimeSlot.set(slotKey, dedupeKey);
      }
    }
  }

  const deduped = orderedKeys.map((k) => byKey.get(k)!);
  return sortGamesChronologically(deduped);
}

export const dedupeAndCleanGames = mergeAndDedupeGames;

const ORDINAL_TO_NUMBER: Record<string, number> = {
  one: 1,
  first: 1,
  "1": 1,
  "1st": 1,
  two: 2,
  second: 2,
  "2": 2,
  "2nd": 2,
  three: 3,
  third: 3,
  "3": 3,
  "3rd": 3,
  four: 4,
  fourth: 4,
  "4": 4,
  "4th": 4,
  five: 5,
  fifth: 5,
  "5": 5,
  "5th": 5,
  six: 6,
  sixth: 6,
  "6": 6,
  "6th": 6,
};

export function parseGameNumberReference(text: string): number | null {
  const m = text.match(
    /\b(?:game\s+(one|two|three|four|five|six|\d+)|g\s*(\d+)|(first|second|third|fourth|fifth|sixth|1st|2nd|3rd|4th|5th|6th)\s+game)\b/i
  );
  if (!m) return null;
  const token = (m[1] || m[2] || m[3] || "").toLowerCase();
  return ORDINAL_TO_NUMBER[token] ?? (Number.isFinite(parseInt(token, 10)) ? parseInt(token, 10) : null);
}

/**
 * Deterministically parses short natural-language schedule updates like:
 * - "game one is now white jerseys"
 * - "Game 2 moved to Court 3"
 * - "first game tip-off at 1:30 PM"
 * Returns the patched game(s) when a target existing game and at least one field update are detected,
 * or null if the text is a full multi-line schedule.
 */
export function applyPartialTextPatchToGames<T extends MergeableGame>(
  rawText: string,
  existingGames: T[]
): T[] | null {
  const text = (rawText || "").trim();
  if (!text || !Array.isArray(existingGames) || existingGames.length === 0) {
    return null;
  }

  const targetNum = parseGameNumberReference(text);
  if (!targetNum) return null;

  const targetIdx = existingGames.findIndex(
    (g, idx) => (g.gameNumber ?? idx + 1) === targetNum
  );
  if (targetIdx === -1) return null;

  const base = existingGames[targetIdx];
  let changed = false;
  const patch: Partial<T> = {};

  if (/\b(white|light|home)\b/i.test(text)) {
    patch.jerseyColor = "White (Home)";
    changed = true;
  } else if (/\b(black|dark|away)\b/i.test(text)) {
    patch.jerseyColor = "Dark / Black (Away)";
    changed = true;
  }

  const courtMatch = text.match(/\bcourt\s*#?\s*([a-z0-9]+)\b/i);
  if (courtMatch?.[1]) {
    patch.court = `Court ${courtMatch[1].toUpperCase()}`;
    changed = true;
  }

  const timeMatch = text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const mins = parseInt(timeMatch[2], 10);
    const mer = (timeMatch[3] || "").toUpperCase();
    if (mer === "PM" && h < 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    patch.tipOffMinutes = h * 60 + mins;
    patch.tipOff = `${timeMatch[1]}:${timeMatch[2]}${mer ? ` ${mer}` : ""}`;
    changed = true;
  }

  if (!changed) return null;

  const updatedMatchup =
    patch.jerseyColor && base.opponent
      ? base.matchup?.replace(/\s+(vs|at)\s+/i, /away|black/i.test(patch.jerseyColor) ? " at " : " vs ")
      : base.matchup;

  return [
    {
      ...base,
      ...patch,
      ...(updatedMatchup ? { matchup: updatedMatchup } : {}),
      gameNumber: base.gameNumber ?? targetIdx + 1,
      isPlaceholder: false,
    },
  ];
}

export function buildIsoTipOffTimestamp(
  dateStr?: string,
  dayLabel?: string,
  tipOffMinutes = 600
): string {
  const sortableDate = parseSortableDateValue(dateStr, dayLabel);
  let year = 2026;
  let month = 11;
  let day = 21;
  if (sortableDate > 19000000 && sortableDate < 90000000) {
    year = Math.floor(sortableDate / 10000);
    month = Math.floor((sortableDate % 10000) / 100);
    day = sortableDate % 100;
  }
  const safeMins = Number.isFinite(tipOffMinutes) ? Math.max(0, Math.min(1439, tipOffMinutes)) : 600;
  const hh = Math.floor(safeMins / 60);
  const mm = safeMins % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  // Store with -05:00 (EST) offset so local Eastern time round-trips accurately
  return `${year}-${pad(month)}-${pad(day)}T${pad(hh)}:${pad(mm)}:00-05:00`;
}

export function parseTipOffTimestamp(isoStr?: string): {
  tipOffMinutes?: number;
  dateStr?: string;
  dayLabel?: string;
} {
  if (!isoStr) return {};
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return {};
  // Format in America/Toronto so EST/EDT tip-off hours match what was stored
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const y = get("year");
  const m = get("month");
  const day = get("day");
  const hr = parseInt(get("hour"), 10) % 24;
  const min = parseInt(get("minute"), 10);
  const dayLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
  return {
    tipOffMinutes: hr * 60 + min,
    dateStr: `${y}-${m}-${day}`,
    dayLabel,
  };
}

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
