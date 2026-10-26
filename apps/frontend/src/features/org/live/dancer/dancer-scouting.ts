import type { ApiSchemas } from "@/lib/api/client";

export type School = ApiSchemas["OrgsIdSchoolsResponse"][number];
export type SchoolSelection = ApiSchemas["OrgsIdMyselectionsResponse"][number];
export type DancerCallback =
  ApiSchemas["OrgsIdDancerCallbacksResponse"]["callbacks"][number];

/** `max_school_selections` of -1 means the dancer may pick any number of schools. */
export const UNLIMITED_SELECTIONS = -1;

/** The org's `max_school_selections` setting, defaulting to 3 as the backend does. */
export function maxSchoolSelections(settings: Record<string, unknown>): number {
  return Number(settings?.max_school_selections) || 3;
}

export function selectionsFull(count: number, max: number): boolean {
  return max !== UNLIMITED_SELECTIONS && count >= max;
}

export function schoolLabel(organization: string | null): string {
  return organization?.trim() || "[School name]";
}

export function coachLabel(person: {
  firstName: string;
  lastName: string;
}): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

export function initials(person: {
  firstName: string;
  lastName: string;
}): string {
  return `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
}

function orgKey(organization: string | null): string | null {
  const key = organization?.trim().toLowerCase();
  return key ? key : null;
}

/**
 * Finds the callback a school sent. Callbacks carry the coach's Roster Entry on
 * the event they were sent at, while the schools list keeps one roster row per
 * school (the active event's when it has one), so fall back to the school name.
 */
export function callbackForSchool(
  school: Pick<School, "rosterId" | "organization">,
  callbacks: readonly DancerCallback[],
): DancerCallback | null {
  const byRoster = callbacks.find((cb) => cb.coachRosterId === school.rosterId);
  if (byRoster) return byRoster;
  const key = orgKey(school.organization);
  if (!key) return null;
  return callbacks.find((cb) => orgKey(cb.organization) === key) ?? null;
}

/** 1-based rank of a school among the dancer's selections, which the API lists in rank order, or null. */
export function rankForSchool(
  school: Pick<School, "rosterId" | "organization">,
  selections: readonly SchoolSelection[],
): number | null {
  const index = selections.findIndex(
    (selection) => selection.coachRosterId === school.rosterId,
  );
  return index === -1 ? null : index + 1;
}

/** The rank of the school that sent a callback, matched like `callbackForSchool`. */
export function rankForCallback(
  callback: DancerCallback,
  selections: readonly SchoolSelection[],
): number | null {
  const byRoster = selections.findIndex(
    (selection) => selection.coachRosterId === callback.coachRosterId,
  );
  if (byRoster !== -1) return byRoster + 1;
  const key = orgKey(callback.organization);
  if (!key) return null;
  const byName = selections.findIndex(
    (selection) => orgKey(selection.organization) === key,
  );
  return byName === -1 ? null : byName + 1;
}

/** "Showcase 2" or "Showcases 1, 3". */
export function showcaseText(numbers: readonly number[]): string | null {
  if (numbers.length === 0) return null;
  return numbers.length === 1
    ? `Showcase ${numbers[0]}`
    : `Showcases ${numbers.join(", ")}`;
}

export interface CoachRow {
  school: School;
  name: string;
  coach: string;
  /** 1-based top-choice rank, or null. */
  rank: number | null;
  selection: SchoolSelection | null;
  callback: DancerCallback | null;
}

export function buildCoachRows(
  schools: readonly School[],
  selections: readonly SchoolSelection[],
  callbacks: readonly DancerCallback[],
): CoachRow[] {
  return schools.map((school) => {
    const rank = rankForSchool(school, selections);
    return {
      school,
      name: schoolLabel(school.organization),
      coach: coachLabel(school),
      rank,
      selection: rank === null ? null : selections[rank - 1],
      callback: callbackForSchool(school, callbacks),
    };
  });
}

export type CoachFilter = "all" | "top" | "called";
export type CoachSortKey = "school" | "coach";
export type SortDir = "asc" | "desc";

export function coachFilterCounts(rows: readonly CoachRow[]) {
  return {
    all: rows.length,
    top: rows.filter((row) => row.rank !== null).length,
    called: rows.filter((row) => row.callback !== null).length,
  };
}

export function filterCoachRows(
  rows: readonly CoachRow[],
  filter: CoachFilter,
  query: string,
): CoachRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filter === "top" && row.rank === null) return false;
    if (filter === "called" && row.callback === null) return false;
    if (!q) return true;
    return (
      row.name.toLowerCase().includes(q) || row.coach.toLowerCase().includes(q)
    );
  });
}

export function sortCoachRows(
  rows: readonly CoachRow[],
  key: CoachSortKey,
  dir: SortDir,
): CoachRow[] {
  const sign = dir === "asc" ? 1 : -1;
  const value = (row: CoachRow) => (key === "school" ? row.name : row.coach);
  return [...rows].sort(
    (a, b) =>
      sign *
      value(a).localeCompare(value(b), undefined, { sensitivity: "base" }),
  );
}

export interface ChoiceSlot {
  rank: number;
  selection: SchoolSelection | null;
  /** The schools-list row for the selection, for the coach name. */
  school: School | null;
}

/**
 * The top-choice slots in rank order: every selection, then open slots up to
 * the limit (none when the limit is unlimited).
 */
export function choiceSlots(
  selections: readonly SchoolSelection[],
  schools: readonly School[],
  max: number,
): ChoiceSlot[] {
  const filled: ChoiceSlot[] = selections.map((selection, index) => ({
    rank: index + 1,
    selection,
    school:
      schools.find((school) => school.rosterId === selection.coachRosterId) ??
      null,
  }));
  if (max === UNLIMITED_SELECTIONS) return filled;
  const open: ChoiceSlot[] = [];
  for (let rank = filled.length + 1; rank <= max; rank++) {
    open.push({ rank, selection: null, school: null });
  }
  return [...filled, ...open];
}
