import { useMemo } from "react";

export type EventPhase = "upcoming" | "imminent" | "live" | "wrapped";

export interface EventPhaseInfo {
  phase: EventPhase;
  /** Human-readable label: "47 days out", "Day 2 of 3", "Wrapped 2 days ago" */
  label: string;
  /** Days from now to startDate (negative if event has started) */
  daysUntilStart: number;
  /** For live events: which day of the event we're on (1-indexed) */
  liveDay: number | null;
  /** Total number of days the event runs */
  totalDays: number;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseYmd(ymd: string): Date {
  // Parse as local date to avoid TZ drift on "YYYY-MM-DD" strings.
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86400000);
}

function pluralDays(n: number): string {
  return n === 1 ? "1 day" : `${n} days`;
}

export function computeEventPhase(
  startDateYmd: string,
  endDateYmd: string,
  now: Date = new Date(),
): EventPhaseInfo {
  const start = parseYmd(startDateYmd);
  const end = parseYmd(endDateYmd);
  const today = startOfDay(now);
  const daysUntilStart = daysBetween(today, start);
  const totalDays = Math.max(1, daysBetween(start, end) + 1);

  if (today < start) {
    const phase: EventPhase = daysUntilStart <= 7 ? "imminent" : "upcoming";
    const label =
      daysUntilStart === 0
        ? "Starts today"
        : daysUntilStart === 1
          ? "1 day until event weekend"
          : `${pluralDays(daysUntilStart)} until event weekend`;
    return { phase, label, daysUntilStart, liveDay: null, totalDays };
  }

  if (today >= start && today <= end) {
    const liveDay = daysBetween(start, today) + 1;
    const label =
      totalDays > 1 ? `Day ${liveDay} of ${totalDays}` : "Happening now";
    return { phase: "live", label, daysUntilStart, liveDay, totalDays };
  }

  const daysSinceEnd = daysBetween(end, today);
  const label =
    daysSinceEnd === 0
      ? "Just wrapped"
      : daysSinceEnd === 1
        ? "Wrapped 1 day ago"
        : `Wrapped ${daysSinceEnd} days ago`;
  return { phase: "wrapped", label, daysUntilStart, liveDay: null, totalDays };
}

export function useEventPhase(
  startDate: string,
  endDate: string,
): EventPhaseInfo {
  return useMemo(
    () => computeEventPhase(startDate, endDate),
    [startDate, endDate],
  );
}
