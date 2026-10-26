import { useMemo } from "react";

import type { OrgEvent } from "@/features/org/api/admin-queries";
import {
  daysBetweenYmd,
  normalizeTime,
  timeToMinutes,
} from "@/features/org/lib/event-clock";
import { useNow } from "./use-now";

/**
 * - `upcoming` / `imminent`: before the event's first day (imminent within 7 days).
 * - `live`: inside today's daily hours.
 * - `paused`: on an event day but outside its hours (before the day's start, or
 *   after its end with more days to come). Day N of M still applies.
 * - `wrapped`: from `endsAt` on.
 */
export type EventPhase =
  | "upcoming"
  | "imminent"
  | "live"
  | "paused"
  | "wrapped";

export interface EventPhaseInfo {
  phase: EventPhase;
  /** Human-readable label: "47 days out", "Day 2 of 3", "Wrapped 2 days ago" */
  label: string;
  /** Calendar days from today (in the event zone) to startDate; negative once it has started. */
  daysUntilStart: number;
  /** Today's event day (1-based) while live or paused; otherwise null. */
  day: number | null;
  /** Total number of days the event runs */
  totalDays: number;
  /** True from `startsAt` on, between days included (the backend's `hasStarted`). */
  hasStarted: boolean;
  /**
   * While paused: when the hours start again, "Starts 10:00" (first day),
   * "Resumes 10:00" (later day, before its hours) or "Resumes tomorrow at 10:00".
   */
  nextStartLabel: string | null;
}

/** The fields phase needs: the dates, daily hours, and the backend's instants and zone. */
export type EventPhaseFields = Pick<
  OrgEvent,
  | "startDate"
  | "endDate"
  | "startTime"
  | "endTime"
  | "startsAt"
  | "endsAt"
  | "effectiveTimezone"
>;

const MINUTES_PER_DAY = 24 * 60;

/** Today's date ("YYYY-MM-DD") and minutes since midnight on the wall clock in `timeZone`. */
export function zonedNow(
  now: Date,
  timeZone: string,
): { ymd: string; minutes: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
  } catch {
    return zonedNow(now, "UTC");
  }
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "0";
  return {
    ymd: `${part("year")}-${part("month")}-${part("day")}`,
    minutes:
      Number(part("hour")) * 60 +
      Number(part("minute")) +
      Number(part("second")) / 60,
  };
}

/**
 * The daily hours as minutes since midnight in the event zone, the window the
 * backend's `eventDayWindow` uses: `startTime` (else 00:00) to `endTime` (else
 * the next 00:00).
 */
export function dailyWindowMinutes(
  event: Pick<OrgEvent, "startTime" | "endTime">,
): { start: number; end: number } {
  const start = timeToMinutes(event.startTime) ?? 0;
  const end = timeToMinutes(event.endTime) ?? MINUTES_PER_DAY;
  return { start, end: end > start ? end : MINUTES_PER_DAY };
}

function pluralDays(n: number): string {
  return n === 1 ? "1 day" : `${n} days`;
}

/**
 * Where the event is in time at `now`. The bounds are the backend's `startsAt`
 * and `endsAt`; the day count and the daily hours are read on the wall clock
 * in `effectiveTimezone`, so the result doesn't depend on the viewer's zone.
 */
export function computeEventPhase(
  event: EventPhaseFields,
  now: Date = new Date(),
): EventPhaseInfo {
  const t = now.getTime();
  // A missing instant reads as never reached (start) or never passed (end).
  const startsAt = Date.parse(event.startsAt ?? "") || Infinity;
  const endsAt = Date.parse(event.endsAt ?? "") || Infinity;
  const today = zonedNow(now, event.effectiveTimezone || "UTC");
  const daysUntilStart = daysBetweenYmd(today.ymd, event.startDate);
  const totalDays = Math.max(
    1,
    daysBetweenYmd(event.startDate, event.endDate) + 1,
  );
  const hasStarted = t >= startsAt;
  const base = { daysUntilStart, totalDays, hasStarted };

  if (t >= endsAt) {
    // Ending today (after the last day's hours) or yesterday is "just".
    const daysSinceEnd = daysBetweenYmd(event.endDate, today.ymd);
    const label =
      daysSinceEnd <= 1 ? "Just wrapped" : `Wrapped ${daysSinceEnd} days ago`;
    return {
      ...base,
      phase: "wrapped",
      label,
      day: null,
      nextStartLabel: null,
    };
  }

  if (daysUntilStart > 0) {
    const phase: EventPhase = daysUntilStart <= 7 ? "imminent" : "upcoming";
    const label =
      daysUntilStart === 1
        ? "1 day until event weekend"
        : `${pluralDays(daysUntilStart)} until event weekend`;
    return { ...base, phase, label, day: null, nextStartLabel: null };
  }

  const day = Math.min(totalDays, 1 - daysUntilStart);
  const dayLabel =
    totalDays > 1 ? `Day ${day} of ${totalDays}` : "Happening now";
  const hours = dailyWindowMinutes(event);
  if (today.minutes >= hours.start && today.minutes < hours.end) {
    return {
      ...base,
      phase: "live",
      label: dayLabel,
      day,
      nextStartLabel: null,
    };
  }

  const start = normalizeTime(event.startTime) ?? "00:00";
  const nextStartLabel =
    today.minutes < hours.start
      ? hasStarted
        ? `Resumes ${start}`
        : `Starts ${start}`
      : `Resumes tomorrow at ${start}`;
  const label = totalDays > 1 ? dayLabel : hasStarted ? "Paused" : "Today";
  return { ...base, phase: "paused", label, day, nextStartLabel };
}

/** `computeEventPhase` on a clock that ticks every minute. */
export function useEventPhase(event: EventPhaseFields): EventPhaseInfo {
  const now = useNow();
  return useMemo(() => computeEventPhase(event, now), [event, now]);
}
