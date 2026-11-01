/**
 * Null-safe parsing of an Org Event's "HH:mm" times and "YYYY-MM-DD" dates.
 * `endTime` is new and null on older rows, and any of these can be missing
 * while a form is half filled, so nothing here throws on undefined, null,
 * empty or malformed input.
 */

/** "12:00" from "12:00" or "12:00:00"; null for a missing or malformed time. */
export function normalizeTime(time: string | null | undefined): string | null {
  const match =
    typeof time === "string" ? time.trim().match(/^(\d{1,2}):(\d{2})/) : null;
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

/** Minutes since midnight for a time, or null when it isn't one. */
export function timeToMinutes(time: string | null | undefined): number | null {
  const hm = normalizeTime(time);
  if (!hm) return null;
  const [h, m] = hm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** [year, month (1-12), day] of a "YYYY-MM-DD" date, or null when it isn't one. */
export function ymdParts(
  ymd: string | null | undefined,
): [number, number, number] | null {
  const match =
    typeof ymd === "string" ? /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd) : null;
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Calendar days from `a` to `b` ("YYYY-MM-DD"); 0 when either is missing. */
export function daysBetweenYmd(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const pa = ymdParts(a);
  const pb = ymdParts(b);
  if (!pa || !pb) return 0;
  const utc = ([y, m, d]: [number, number, number]) => Date.UTC(y, m - 1, d);
  return Math.round((utc(pb) - utc(pa)) / 86_400_000);
}

/** A "YYYY-MM-DD" date as a local-midnight `Date`; today when it isn't a date. */
export function localDateFromYmd(ymd: string | null | undefined): Date {
  const parts = ymdParts(ymd);
  if (!parts) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function isZone(timeZone: string | null | undefined): timeZone is string {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** How far `timeZone`'s wall clock is ahead of UTC at `instant`, in ms. */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wall = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );
  return wall - Math.floor(instant / 1000) * 1000;
}

/**
 * The instant a wall-clock date and time ("YYYY-MM-DD", "HH:mm", default
 * midnight) happens in `timeZone`. Without a known zone it is the viewer's
 * local time. Null when the date isn't one.
 */
export function zonedInstant(
  ymd: string | null | undefined,
  time: string | null | undefined,
  timeZone: string | null | undefined,
): Date | null {
  const parts = ymdParts(ymd);
  if (!parts) return null;
  const minutes = timeToMinutes(time) ?? 0;
  const [y, m, d] = parts;
  if (!isZone(timeZone)) {
    return new Date(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  }
  const wall = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  // Two passes settle the offset across a daylight saving change.
  let instant = wall - zoneOffsetMs(wall, timeZone);
  instant = wall - zoneOffsetMs(instant, timeZone);
  return new Date(instant);
}

/** A local `Date`'s calendar day as "YYYY-MM-DD". */
export function ymdOf(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** The calendar day of `now` in `timeZone` ("YYYY-MM-DD"); the viewer's day without a zone. */
export function todayIn(
  now: Date,
  timeZone: string | null | undefined,
): string {
  if (!isZone(timeZone)) return ymdOf(now);
  const offset = zoneOffsetMs(now.getTime(), timeZone);
  return new Date(now.getTime() + offset).toISOString().slice(0, 10);
}

/** The day after a "YYYY-MM-DD" date. */
export function nextYmd(ymd: string): string {
  const parts = ymdParts(ymd);
  if (!parts) return ymd;
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1))
    .toISOString()
    .slice(0, 10);
}

/**
 * An instant as 24-hour "HH:mm" on the wall clock in `timeZone` (the viewer's
 * clock without a known zone). "" for a missing or invalid instant.
 */
export function formatClock(
  iso: string | Date | null | undefined,
  timeZone?: string | null,
): string {
  if (!iso) return "";
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    ...(isZone(timeZone) ? { timeZone } : {}),
  }).format(date);
}
