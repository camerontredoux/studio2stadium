import type {
  AuditAction,
  AuditListParams,
  AuditLogEntry,
  AuditResource,
} from "@/features/org/api/audit-queries";

import {
  nextYmd,
  todayIn,
  ymdOf,
  zonedInstant,
} from "@/features/org/lib/event-clock";

import { displayAction, type AuditDisplayAction } from "./audit-format";

export type DatePreset =
  | "all"
  | "today"
  | "event"
  | "7d"
  | "30d"
  | "90d"
  | "custom";

export type AuditFilters = {
  date: DatePreset;
  /** Custom range, inclusive days. */
  customStart: Date | null;
  customEnd: Date | null;
  actions: AuditDisplayAction[];
  resources: AuditResource[];
  search: string;
};

export const EMPTY_FILTERS: AuditFilters = {
  date: "all",
  customStart: null,
  customEnd: null,
  actions: [],
  resources: [],
  search: "",
};

export const DATE_PRESETS: readonly { id: DatePreset; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "event", label: "This event" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "custom", label: "Custom range" },
];

/**
 * The event's dates as `YYYY-MM-DD` strings, as the events API returns them,
 * and the zone its days are counted in. Without a zone, days are the viewer's.
 */
export type EventDates = {
  startDate: string;
  endDate: string;
  timeZone?: string | null;
} | null;

const DAY = 86_400_000;

/** `YYYY-MM-DD` as local midnight. */
export function parseDay(iso: string | null | undefined): Date | null {
  const [y, m, d] = (iso ?? "").slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Midnight starting `ymd` in `timeZone`. */
function dayStart(ymd: string, timeZone: string | null | undefined) {
  return zonedInstant(ymd, null, timeZone) ?? undefined;
}

/** The last millisecond of `ymd` in `timeZone`. */
function dayEnd(ymd: string, timeZone: string | null | undefined) {
  const next = zonedInstant(nextYmd(ymd), null, timeZone);
  return next ? new Date(next.getTime() - 1) : undefined;
}

/** The time window a filter selects; open ends are undefined. */
export function resolveDateRange(
  filters: Pick<AuditFilters, "date" | "customStart" | "customEnd">,
  now: Date,
  event: EventDates,
): { from?: Date; to?: Date } {
  const zone = event?.timeZone;
  switch (filters.date) {
    case "today":
      return { from: dayStart(todayIn(now, zone), zone) };
    case "7d":
      return { from: new Date(now.getTime() - 7 * DAY) };
    case "30d":
      return { from: new Date(now.getTime() - 30 * DAY) };
    case "90d":
      return { from: new Date(now.getTime() - 90 * DAY) };
    case "event": {
      if (!event || !parseDay(event.startDate)) return {};
      return {
        from: dayStart(event.startDate, zone),
        to: parseDay(event.endDate) ? dayEnd(event.endDate, zone) : undefined,
      };
    }
    case "custom": {
      // The calendar picks days; they are read as days in the event's zone.
      const start = filters.customStart;
      const end = filters.customEnd ?? filters.customStart;
      return {
        from: start ? dayStart(ymdOf(start), zone) : undefined,
        to: end ? dayEnd(ymdOf(end), zone) : undefined,
      };
    }
    default:
      return {};
  }
}

function apiAction(action: AuditDisplayAction): AuditAction {
  return action === "check_in" ? "update" : action;
}

/**
 * The list query's params. The API filters one action and one resource at a
 * time, so it gets a value only when the selection maps to exactly one;
 * `matchesFilters` narrows the rest on the client.
 */
export function toListParams(
  filters: AuditFilters,
  now: Date,
  event: EventDates,
): Omit<AuditListParams, "page" | "limit"> {
  const { from, to } = resolveDateRange(filters, now, event);
  const actions = new Set(filters.actions.map(apiAction));
  const search = filters.search.trim();
  return {
    search: search || undefined,
    action: actions.size === 1 ? [...actions][0] : undefined,
    resource: filters.resources.length === 1 ? filters.resources[0] : undefined,
    from: from?.toISOString(),
    to: to?.toISOString(),
    sortDir: "desc",
  };
}

/** True when the API applies every filter itself, so its total is exact. */
export function isServerExact(filters: AuditFilters): boolean {
  const actionsExact =
    filters.actions.length === 0 ||
    (filters.actions.length === 1 &&
      filters.actions[0] !== "update" &&
      filters.actions[0] !== "check_in") ||
    // Update + check in is every API `update`.
    (filters.actions.length === 2 &&
      filters.actions.includes("update") &&
      filters.actions.includes("check_in"));
  return actionsExact && filters.resources.length <= 1;
}

/** The client-side half of the action and resource filters. */
export function matchesFilters(
  entry: AuditLogEntry,
  filters: Pick<AuditFilters, "actions" | "resources">,
): boolean {
  if (
    filters.actions.length > 0 &&
    !filters.actions.includes(displayAction(entry))
  ) {
    return false;
  }
  if (
    filters.resources.length > 0 &&
    !filters.resources.includes(entry.resource)
  ) {
    return false;
  }
  return true;
}

export function hasActiveFilters(filters: AuditFilters): boolean {
  return (
    filters.date !== "all" ||
    filters.actions.length > 0 ||
    filters.resources.length > 0 ||
    filters.search.trim() !== ""
  );
}

/** "Action", "Delete", or "Action · 3". */
export function multiChipLabel(name: string, selected: readonly string[]) {
  if (selected.length === 0) return name;
  if (selected.length === 1) return selected[0]!;
  return `${name} · ${selected.length}`;
}

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/** "Oct 24", or "Oct 22–24" / "Oct 30–Nov 2" for a span. */
export function formatDaySpan(start: Date, end: Date | null): string {
  if (!end || startOfDay(start).getTime() === startOfDay(end).getTime()) {
    return shortDate.format(start);
  }
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  return sameMonth
    ? `${shortDate.format(start)}–${end.getDate()}`
    : `${shortDate.format(start)}–${shortDate.format(end)}`;
}

/** The right-aligned note on a date preset: today's date, the event's span. */
export function presetHint(
  preset: DatePreset,
  now: Date,
  event: EventDates,
): string | undefined {
  if (preset === "today") {
    const today = parseDay(todayIn(now, event?.timeZone));
    return today ? shortDate.format(today) : undefined;
  }
  if (preset === "event" && event) {
    const start = parseDay(event.startDate);
    if (start) return formatDaySpan(start, parseDay(event.endDate));
  }
  return undefined;
}

export function dateChipLabel(
  filters: Pick<AuditFilters, "date" | "customStart" | "customEnd">,
): string {
  if (filters.date === "custom") {
    return filters.customStart
      ? formatDaySpan(filters.customStart, filters.customEnd)
      : "Custom range";
  }
  return DATE_PRESETS.find((p) => p.id === filters.date)?.label ?? "All time";
}
