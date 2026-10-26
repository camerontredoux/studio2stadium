import { formatClock } from "@/features/org/lib/event-clock";

/**
 * Pure list logic for the check-in desk: the filter, search, grouping and sort
 * of the Dancers panel, the counts and the percentage. No React, no fetching.
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

export interface DeskGroup<T extends DeskDancer = DeskDancer> {
  key: "out" | "in";
  label: "Not yet" | "Checked in";
  rows: T[];
}

export interface DeskCounts {
  total: number;
  checkedIn: number;
  notYet: number;
}

export function dancerName(d: DeskDancer): string {
  const name = [d.firstName, d.lastName].filter(Boolean).join(" ").trim();
  return name || "[Name]";
}

const collator = new Intl.Collator(undefined, { sensitivity: "base" });

/** Last name, then first name, then bib, so the "Not yet" list reads like a register. */
function compareByName(a: DeskDancer, b: DeskDancer): number {
  return (
    collator.compare(a.lastName ?? "", b.lastName ?? "") ||
    collator.compare(a.firstName ?? "", b.firstName ?? "") ||
    (a.bibNumber ?? Infinity) - (b.bibNumber ?? Infinity)
  );
}

/** Newest check-in first. */
function compareByCheckInDesc(a: DeskDancer, b: DeskDancer): number {
  return (
    Date.parse(b.checkedInAt ?? "") - Date.parse(a.checkedInAt ?? "") ||
    compareByName(a, b)
  );
}

/**
 * Matches a name (first, last or "first last") or a bib. Bibs match from the
 * start, so "10" finds 101 and 102 but not 210. A leading "#" is ignored.
 */
export function matchesQuery(d: DeskDancer, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/^#/, "");
  if (!q) return true;
  if (d.bibNumber != null && String(d.bibNumber).startsWith(q)) return true;
  return dancerName(d).toLowerCase().includes(q);
}

/**
 * The groups to render for a filter and search: "Not yet" sorted by name, then
 * "Checked in" newest first. Empty groups are left out.
 */
export function groupDesk<T extends DeskDancer>(
  dancers: readonly T[],
  { filter, query }: { filter: DeskFilter; query: string },
): DeskGroup<T>[] {
  const matched = dancers.filter((d) => matchesQuery(d, query));
  const groups: DeskGroup<T>[] = [];
  if (filter !== "in") {
    groups.push({
      key: "out",
      label: "Not yet",
      rows: matched.filter((d) => !d.checkedInAt).sort(compareByName),
    });
  }
  if (filter !== "out") {
    groups.push({
      key: "in",
      label: "Checked in",
      rows: matched.filter((d) => d.checkedInAt).sort(compareByCheckInDesc),
    });
  }
  return groups.filter((g) => g.rows.length > 0);
}

export function countDesk(dancers: readonly DeskDancer[]): DeskCounts {
  const checkedIn = dancers.filter((d) => d.checkedInAt).length;
  return {
    total: dancers.length,
    checkedIn,
    notYet: dancers.length - checkedIn,
  };
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
