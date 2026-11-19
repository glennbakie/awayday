export interface MergeableGame {
  day?: string;
  dateStr?: string;
  tipOff?: string;
  arrivalCall?: string;
  court?: string;
  venueName?: string;
  venueAddress?: string;
  opponent?: string;
  jerseyColor?: string;
  telemetryTag?: string;
  isPlaceholder?: boolean;
  [key: string]: any;
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

  return orderedKeys.map((k) => byKey.get(k)!);
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
