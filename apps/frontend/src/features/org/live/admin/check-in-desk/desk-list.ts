import { formatClock } from "@/features/org/lib/event-clock";

/**
 * Pure helpers for the check-in desk's Dancers panel: names, the percentage,
 * the empty message and check-in times. No React, no fetching.
 */

export type DeskFilter = "all" | "out" | "in";

/** The fields of a dancer Roster Entry the desk list needs. */
export interface DeskDancer {
  id: string;
  bibNumber: number | null;
  firstName: string | null;
  lastName: string | null;
  checkedInAt: string | null;
}

export function dancerName(d: DeskDancer): string {
  const name = [d.firstName, d.lastName].filter(Boolean).join(" ").trim();
  return name || "[Name]";
}

/** Whole-number percentage, 0 when there are no dancers, never above 100. */
export function checkInPercent(checkedIn: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((checkedIn / total) * 100)));
}

/** What the list says when no row is shown. */
export function emptyMessage({
  filter,
  query,
  total,
}: {
  filter: DeskFilter;
  query: string;
  total: number;
}): string {
  const q = query.trim();
  if (q) return `No dancers match “${q}”`;
  if (total === 0) return "No dancers on the roster yet";
  if (filter === "out") return "Everyone is checked in";
  return "No one checked in yet";
}

/** A check-in time as 24-hour "HH:mm" on the event's clock (`timeZone`; the viewer's without one). */
export function formatCheckInTime(
  iso: string | null | undefined,
  timeZone?: string | null,
): string {
  return formatClock(iso, timeZone);
}
