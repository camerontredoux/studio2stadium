import { z } from "zod";

import type {
  RosterEntry,
  RosterListParams,
  RosterType,
} from "@/features/org/api/roster-queries";

export const ROSTER_STATUSES = ["all", "active", "pending"] as const;
export type RosterStatusFilter = (typeof ROSTER_STATUSES)[number];

export type RosterSortDir = "asc" | "desc";

const SORT_KEYS = [
  "lastName",
  "email",
  "bibNumber",
  "organization",
  "isRegistered",
  "checkedInAt",
] as const satisfies readonly NonNullable<RosterListParams["sortBy"]>[];

/** The columns the roster tables sort by (a subset of what the API accepts). */
export type RosterSortKey = (typeof SORT_KEYS)[number];

/**
 * The roster pages' URL state. `status` and `q` are the contract the dashboard
 * links to (`?status=pending`); `sort` and `dir` keep the table's sort.
 */
export const rosterSearchSchema = z.object({
  status: z.enum(ROSTER_STATUSES).default("all").catch("all"),
  q: z.string().optional().catch(undefined),
  sort: z.enum(SORT_KEYS).optional().catch(undefined),
  dir: z.enum(["asc", "desc"]).optional().catch(undefined),
});

export type RosterSearch = z.infer<typeof rosterSearchSchema>;

export type RosterColumnId =
  | "bib"
  | "name"
  | "email"
  | "school"
  | "status"
  | "paid"
  | "checkedIn";

export interface RosterColumn {
  id: RosterColumnId;
  label: string;
  sortKey?: RosterSortKey;
  /** Desktop grid track. */
  width: string;
  /** Phone (≤800px) grid track, from the mockup's `.rl-d` / `.rl-c`; `null` drops the column on phones. */
  phoneWidth: string | null;
}

const COLUMNS: Record<RosterColumnId, RosterColumn> = {
  bib: {
    id: "bib",
    label: "Bib #",
    sortKey: "bibNumber",
    width: "64px",
    phoneWidth: "56px",
  },
  name: {
    id: "name",
    label: "Name",
    sortKey: "lastName",
    width: "minmax(120px,1fr)",
    phoneWidth: "minmax(72px,1fr)",
  },
  email: {
    id: "email",
    label: "Email",
    sortKey: "email",
    width: "minmax(180px,1.5fr)",
    phoneWidth: null,
  },
  school: {
    id: "school",
    label: "School",
    sortKey: "organization",
    width: "minmax(100px,.8fr)",
    phoneWidth: "minmax(80px,.8fr)",
  },
  status: {
    id: "status",
    label: "Status",
    sortKey: "isRegistered",
    width: "96px",
    phoneWidth: "64px",
  },
  paid: { id: "paid", label: "Paid", width: "80px", phoneWidth: null },
  checkedIn: {
    id: "checkedIn",
    label: "Checked in",
    sortKey: "checkedInAt",
    width: "96px",
    phoneWidth: "84px",
  },
};

export interface RosterKindConfig {
  type: RosterType;
  title: string;
  /** Lowercase plural for copy ("dancers"). */
  plural: string;
  singular: string;
  searchPlaceholder: string;
  /** The search's accessible name; phones show only "Search" as the placeholder. */
  searchLabel: string;
  /** Min width of the table before it scrolls sideways (desktop, phone). */
  minWidth: string;
}

export const ROSTER_KINDS: Record<RosterType, RosterKindConfig> = {
  dancer: {
    type: "dancer",
    title: "Dancers",
    plural: "dancers",
    singular: "dancer",
    searchPlaceholder: "Search bib, name, email",
    searchLabel: "Search dancers by bib, name or email",
    minWidth: "min-w-[680px] bp-phone:min-w-[356px]",
  },
  coach: {
    type: "coach",
    title: "Coaches",
    plural: "coaches",
    singular: "coach",
    searchPlaceholder: "Search name, email, school",
    searchLabel: "Search coaches by name, email or school",
    minWidth: "min-w-[680px] bp-phone:min-w-[320px]",
  },
};

/** The columns a roster table shows, in order, given the org's feature flags. */
export function rosterColumns(
  type: RosterType,
  flags: { checkIn: boolean; freeTier: boolean },
): RosterColumn[] {
  if (type === "coach") {
    return [COLUMNS.name, COLUMNS.email, COLUMNS.school, COLUMNS.status];
  }
  return [
    COLUMNS.bib,
    COLUMNS.name,
    COLUMNS.email,
    COLUMNS.status,
    ...(flags.freeTier ? [COLUMNS.paid] : []),
    ...(flags.checkIn ? [COLUMNS.checkedIn] : []),
  ];
}

/**
 * The table's grid templates, without the checkbox track (the table is `selectable`,
 * which adds it). Phones drop the columns without a `phoneWidth`.
 */
export function gridTemplates(columns: RosterColumn[]): {
  columns: string;
  phoneColumns: string;
} {
  return {
    columns: columns.map((c) => c.width).join(" "),
    phoneColumns: columns
      .flatMap((c) => (c.phoneWidth ? [c.phoneWidth] : []))
      .join(" "),
  };
}

/** Next sort after clicking a column: unsorted → asc → desc → asc. */
export function nextSort(
  current: { sort?: RosterSortKey; dir?: RosterSortDir },
  key: RosterSortKey,
): { sort: RosterSortKey; dir: RosterSortDir } {
  if (current.sort !== key) return { sort: key, dir: "asc" };
  return { sort: key, dir: current.dir === "asc" ? "desc" : "asc" };
}

/** Merges loaded pages into one list, dropping rows a later page repeats. */
export function mergePages(
  pages: ReadonlyArray<readonly RosterEntry[] | undefined>,
): RosterEntry[] {
  const seen = new Set<string>();
  const rows: RosterEntry[] = [];
  for (const page of pages) {
    for (const row of page ?? []) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push(row);
    }
  }
  return rows;
}

/**
 * What the toolbar's check-in button does for the selected dancers. It checks
 * in everyone who isn't yet; when they all are, it undoes all of them.
 */
export function bulkCheckInPlan(selected: readonly RosterEntry[]): {
  label: "Check in" | "Undo check-in";
  targets: RosterEntry[];
} {
  const notYet = selected.filter((r) => !r.checkedInAt);
  if (notYet.length > 0) return { label: "Check in", targets: notYet };
  return { label: "Undo check-in", targets: [...selected] };
}

export function fullName(entry: Pick<RosterEntry, "firstName" | "lastName">) {
  return `${entry.firstName} ${entry.lastName}`.trim();
}

export function countLabel(n: number, config: RosterKindConfig) {
  return `${n} ${n === 1 ? config.singular : config.plural}`;
}
