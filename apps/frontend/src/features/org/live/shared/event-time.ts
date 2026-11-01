import { eachDayOfInterval, format, isBefore } from "date-fns";

import type { OrgEvent } from "@/features/org/api/admin-queries";
import {
  computeEventPhase,
  type EventPhase,
  type EventPhaseFields,
  type EventPhaseInfo,
  zonedNow,
} from "@/features/org/hooks/use-event-phase";
import {
  localDateFromYmd,
  normalizeTime,
  timeToMinutes,
  ymdParts,
} from "@/features/org/lib/event-clock";

/**
 * Pure helpers for an Org Event's place in time. Every function takes `now` so it can be
 * tested; components get a ticking `now` from `useNow` (`hooks/use-now.ts`).
 *
 * Time zone: "now" is read as the wall clock in the event's `effectiveTimezone` (its own
 * zone, else the org default, else UTC, as the backend resolves it), so the event day and
 * the share of today follow the venue, not the viewer.
 *
 * Event hours: `startTime`–`endTime` are the daily hours, the same on every event day.
 * Phase (live or not) uses them as the backend does: `startTime` (else 00:00) to `endTime`
 * (else midnight). The day progress and "time left" use them when both are set, and
 * otherwise `startTime` (default {@link DEFAULT_DAY_START}) to {@link DEFAULT_DAY_END}
 * (midnight when the start is at or after that).
 */

type EventTimeFields = EventPhaseFields & Pick<OrgEvent, "timezone">;

/** The day's start when the event has no `startTime`. */
export const DEFAULT_DAY_START = "08:00";
/** The day's end for the day progress when the event has no `endTime`. */
export const DEFAULT_DAY_END = "22:00";

const MINUTES_PER_DAY = 24 * 60;

export { normalizeTime };

/** Minutes since midnight; 0 for a missing or malformed time. */
function toMinutes(hm: string | null | undefined): number {
  return timeToMinutes(hm) ?? 0;
}

/** "3h 20m left today", "45m left today", "2h left today". */
export function formatTimeLeft(minutes: number): string {
  const total = Math.max(0, Math.ceil(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const text = h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
  return `${text} left today`;
}

/** Every calendar day of the event, inclusive. One day when the end is before the start. */
export function eventDays(event: Pick<OrgEvent, "startDate" | "endDate">) {
  const start = localDateFromYmd(event.startDate);
  const end = localDateFromYmd(event.endDate);
  if (isBefore(end, start)) return [start];
  return eachDayOfInterval({ start, end });
}

/** A DayProgress segment label: "Thu 22". */
export function formatDayLabel(date: Date): string {
  return format(date, "EEE d");
}

/** A rail date: "Thu, Oct 22". */
export function formatRailDate(ymd: string | null | undefined): string {
  return format(localDateFromYmd(ymd), "EEE, MMM d");
}

/** The rail's read-only dates: "Thu, Oct 22 → Sat, Oct 24", or one date for a single-day event. */
export function formatRailDateRange(
  event: Pick<OrgEvent, "startDate" | "endDate">,
): string {
  const start = formatRailDate(event.startDate);
  if (event.startDate === event.endDate) return start;
  return `${start} → ${formatRailDate(event.endDate)}`;
}

/** The year for "Dates · 2026"; "2026–2027" when the event spans New Year. */
export function eventYearLabel(
  event: Pick<OrgEvent, "startDate" | "endDate">,
): string {
  const start = String(ymdParts(event.startDate)?.[0] ?? "");
  const end = String(ymdParts(event.endDate)?.[0] ?? start);
  return start === end ? start : `${start}–${end}`;
}

/**
 * The zone's short name for "Times · MDT" (at the event's start date, so daylight saving
 * matches the event). Null when the event has no zone or the zone is unknown.
 */
export function timeZoneAbbr(
  event: Pick<OrgEvent, "startDate" | "timezone">,
): string | null {
  if (!event.timezone) return null;
  try {
    const [y, m, d] = ymdParts(event.startDate) ?? [1970, 1, 1];
    const noonUtc = new Date(Date.UTC(y, m - 1, d, 12));
    return (
      new Intl.DateTimeFormat("en-US", {
        timeZone: event.timezone,
        timeZoneName: "short",
      })
        .formatToParts(noonUtc)
        .find((p) => p.type === "timeZoneName")?.value ?? null
    );
  } catch {
    return null;
  }
}

/** "12:00 → 18:00", with "Start time" or "End time" for a missing one (as plain text). */
export function formatTimeRange(
  start: string | null,
  end: string | null,
): string {
  return `${start ?? TIME_PLACEHOLDER.start} → ${end ?? TIME_PLACEHOLDER.end}`;
}

/** The words shown for an unset start or end time; style them as placeholders. */
export const TIME_PLACEHOLDER = {
  start: "Start time",
  end: "End time",
} as const;

/** The hours used for the day progress and time left, as "HH:mm". */
export function eventDayHours(event: Pick<OrgEvent, "startTime" | "endTime">): {
  start: string;
  end: string;
} {
  const start = normalizeTime(event.startTime);
  const end = normalizeTime(event.endTime);
  if (start && end && end > start) return { start, end };
  return { start: start ?? DEFAULT_DAY_START, end: DEFAULT_DAY_END };
}

export type EventDayInfo = {
  /** From `computeEventPhase`. */
  phaseInfo: EventPhaseInfo;
  phase: EventPhase;
  /** Inside today's daily hours. */
  isLive: boolean;
  /** Today's event day, 1-based, while live or paused between hours; otherwise null. */
  day: number | null;
  /** Number of event days (inclusive calendar days). */
  days: number;
  /** One DayProgress label per day: "Thu 22". */
  dayLabels: string[];
  /** Share of today's event hours elapsed, 0 to 100. 0 before the event or after it. */
  todayPct: number;
  /** Minutes until today's end while the day is under way; otherwise null. */
  minutesLeftToday: number | null;
  /**
   * On an event day: "3h 20m left today" while live ("Starts 08:00" or "Done for
   * today" outside the default hours of an event without hours), and while paused
   * "Starts 10:00", "Resumes 10:00" or "Resumes tomorrow at 10:00". Null otherwise.
   */
  timeLeftLabel: string | null;
  /**
   * The badge and progress tag on an event day: "Live" inside the hours,
   * "Today" before the first day's start, "Paused" between later hours. Null
   * before and after the event.
   */
  dayTag: string | null;
  /** "Starts Thu, Nov 13" before the event, "Ended Sat, Nov 15" after it, null on event days. */
  statusLine: string | null;
  /** Before: days until the start. After: days since the end. Null on event days. */
  daysAway: number | null;
  /** The hours used for `todayPct` and the time left, "HH:mm". */
  dayStart: string;
  dayEnd: string;
};

/** Everything the header and rail show about where the event is in time. */
export function eventDayInfo(
  event: EventTimeFields,
  now: Date = new Date(),
): EventDayInfo {
  const phaseInfo = computeEventPhase(event, now);
  const isLive = phaseInfo.phase === "live";
  const dayLabels = eventDays(event).map(formatDayLabel);
  const { start: dayStart, end: dayEnd } = eventDayHours(event);

  const startMin = toMinutes(dayStart);
  const endMinRaw = toMinutes(dayEnd);
  const endMin = endMinRaw > startMin ? endMinRaw : MINUTES_PER_DAY;
  const nowMin = zonedNow(now, event.effectiveTimezone || "UTC").minutes;

  let todayPct = 0;
  let minutesLeftToday: number | null = null;
  let timeLeftLabel: string | null = null;
  if (isLive) {
    todayPct = Math.max(
      0,
      Math.min(100, ((nowMin - startMin) / (endMin - startMin)) * 100),
    );
    // Without daily hours the event is live all day but the progress uses the
    // default hours, so it can be early or late for them.
    if (nowMin < startMin) {
      timeLeftLabel = `Starts ${dayStart}`;
    } else if (nowMin >= endMin) {
      timeLeftLabel = "Done for today";
    } else {
      minutesLeftToday = endMin - nowMin;
      timeLeftLabel = formatTimeLeft(minutesLeftToday);
    }
  } else if (phaseInfo.phase === "paused") {
    // Before today's hours nothing has elapsed; after them the day is full.
    todayPct = nowMin >= endMin ? 100 : 0;
    timeLeftLabel = phaseInfo.nextStartLabel;
  }

  let statusLine: string | null = null;
  let daysAway: number | null = null;
  if (phaseInfo.phase === "upcoming" || phaseInfo.phase === "imminent") {
    statusLine = `Starts ${formatRailDate(event.startDate)}`;
    daysAway = phaseInfo.daysUntilStart;
  } else if (phaseInfo.phase === "wrapped") {
    statusLine = `Ended ${formatRailDate(event.endDate)}`;
    daysAway = -phaseInfo.daysUntilStart - phaseInfo.totalDays + 1;
  }

  return {
    phaseInfo,
    phase: phaseInfo.phase,
    isLive,
    day: phaseInfo.day,
    days: phaseInfo.totalDays,
    dayLabels,
    todayPct,
    minutesLeftToday,
    timeLeftLabel,
    dayTag: isLive
      ? "Live"
      : phaseInfo.phase === "paused"
        ? phaseInfo.hasStarted
          ? "Paused"
          : "Today"
        : null,
    statusLine,
    daysAway,
    dayStart,
    dayEnd,
  };
}
