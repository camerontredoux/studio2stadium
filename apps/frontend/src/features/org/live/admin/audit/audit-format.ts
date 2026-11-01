import type {
  AuditLogChildEntry,
  AuditLogEntry,
  AuditResource,
} from "@/features/org/api/audit-queries";

type Entry = AuditLogEntry | AuditLogChildEntry;
type Metadata = Record<string, unknown>;

/**
 * The actions the log shows. The API records a check-in as an `update` of a
 * roster entry's `checkedInAt`; the log lists it as its own action.
 */
export type AuditDisplayAction =
  | "create"
  | "update"
  | "delete"
  | "activate"
  | "check_in"
  | "upload"
  | "resend_invite";

export const DISPLAY_ACTIONS: readonly AuditDisplayAction[] = [
  "create",
  "update",
  "delete",
  "activate",
  "check_in",
  "upload",
  "resend_invite",
];

export const ACTION_LABELS: Record<AuditDisplayAction, string> = {
  create: "Create",
  update: "Update",
  delete: "Delete",
  activate: "Activate",
  check_in: "Check in",
  upload: "Upload",
  resend_invite: "Resend invite",
};

export const RESOURCES: readonly AuditResource[] = [
  "event",
  "roster",
  "checklist",
  "csv_upload",
  "invite",
  "video",
  "video_category",
];

export const RESOURCE_LABELS: Record<AuditResource, string> = {
  event: "Event",
  roster: "Roster entry",
  checklist: "Checklist",
  csv_upload: "CSV upload",
  invite: "Invite",
  video: "Video",
  video_category: "Video category",
};

function meta(entry: Entry): Metadata {
  return entry.metadata ?? {};
}

function isRecord(value: unknown): value is Metadata {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resourceLabel(resource: AuditResource): string {
  return RESOURCE_LABELS[resource] ?? resource;
}

export function isCheckInEntry(entry: Entry): boolean {
  return (
    entry.action === "update" &&
    entry.resource === "roster" &&
    meta(entry).field === "checkedInAt"
  );
}

export function displayAction(entry: Entry): AuditDisplayAction {
  return isCheckInEntry(entry) ? "check_in" : entry.action;
}

// ── Values ──────────────────────────────────────────────────────────────────

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** 24-hour "Oct 23, 2026 · 10:12:04 MDT", in the event's time zone when known. */
export function absoluteTime(value: string | Date, timeZone?: string | null) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  const zone = timeZone ?? undefined;
  const day = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: zone,
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
    timeZone: zone,
  }).format(date);
  return `${day} · ${time}`;
}

/** "Just now", "35m ago", "2h ago", "3 days ago", "2 months ago". */
export function relativeTime(value: string | Date, now: Date = new Date()) {
  const date = typeof value === "string" ? new Date(value) : value;
  const minutes = Math.round((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;
  const years = Math.round(days / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

/** A recorded value as display text; `null` for nothing recorded (shown as a dash). */
export function formatAuditValue(
  value: unknown,
  timeZone?: string | null,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") {
    return ISO_TIMESTAMP.test(value) ? absoluteTime(value, timeZone) : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => formatAuditValue(item, timeZone))
      .filter((item): item is string => item !== null);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return JSON.stringify(value);
}

// ── Summary ─────────────────────────────────────────────────────────────────

function changedFields(m: Metadata): string[] {
  if (isRecord(m.diff)) return Object.keys(m.diff);
  if (isRecord(m.before) && isRecord(m.after)) {
    const before = m.before;
    const after = m.after;
    return Object.keys(after).filter(
      (key) => formatAuditValue(before[key]) !== formatAuditValue(after[key]),
    );
  }
  return [];
}

function updateSummary(entry: Entry, timeZone?: string | null): string {
  const m = meta(entry);
  if (typeof m.field === "string") {
    if (m.field === "checkedInAt") {
      return m.after ? "Checked in" : "Check-in undone";
    }
    if (m.field === "paid") {
      return m.after ? "Marked paid" : "Marked unpaid";
    }
    const before = formatAuditValue(m.before, timeZone) ?? "—";
    const after = formatAuditValue(m.after, timeZone) ?? "—";
    return `Updated ${m.field}: ${before} → ${after}`;
  }

  const fields = changedFields(m);
  if (fields.length === 1) {
    const field = fields[0]!;
    const from = isRecord(m.diff)
      ? (m.diff[field] as { from?: unknown } | undefined)?.from
      : (m.before as Metadata)[field];
    const to = isRecord(m.diff)
      ? (m.diff[field] as { to?: unknown } | undefined)?.to
      : (m.after as Metadata)[field];
    return `Updated ${field}: ${formatAuditValue(from, timeZone) ?? "—"} → ${formatAuditValue(to, timeZone) ?? "—"}`;
  }
  if (fields.length > 1) return `Updated ${fields.join(", ")}`;
  return `Updated ${resourceLabel(entry.resource).toLowerCase()}`;
}

function uploadSummary(entry: Entry): string {
  const m = meta(entry);
  const added = (m.rowsAdded as number | undefined) ?? 0;
  const updated = (m.rowsUpdated as number | undefined) ?? 0;
  const errored = (m.rowsErrored as number | undefined) ?? 0;
  const activated = m.rowsActivated as number | undefined;
  const pending = m.rowsPending as number | undefined;
  const type = typeof m.type === "string" ? m.type : "row";
  const parts = [`Uploaded ${added} ${type}${added === 1 ? "" : "s"}`];
  if (updated > 0) parts.push(`${updated} updated`);
  if (errored > 0) parts.push(`${errored} errors`);
  if (activated !== undefined && pending !== undefined) {
    parts.push(`${activated} activated`, `${pending} pending`);
  }
  return parts.join(" · ");
}

function activateSummary(entry: Entry): string {
  // Every `activate` entry written today links a roster entry to an account.
  // Saying "Activated" for a reassignment would hide the most consequential
  // thing an admin can do to a dancer's registration.
  if (entry.resource !== "roster") {
    return `Activated ${resourceLabel(entry.resource).toLowerCase()}`;
  }
  const m = meta(entry);
  const before = isRecord(m.before) ? m.before : undefined;
  const after = isRecord(m.after) ? m.after : undefined;
  const previousEmail =
    (before?.email as string | undefined) ??
    (m.previousEmail as string | undefined);
  const newEmail =
    (after?.email as string | undefined) ?? (m.newEmail as string | undefined);

  if (m.relinked === true) {
    return previousEmail && newEmail
      ? `Reassigned roster entry from ${previousEmail} to ${newEmail}`
      : "Reassigned roster entry to a different account";
  }
  return newEmail
    ? `Linked roster entry to ${newEmail}`
    : "Linked roster entry to an account";
}

/** One line saying what happened, for the Summary column. */
export function summarizeEntry(entry: Entry, timeZone?: string | null) {
  const m = meta(entry);
  switch (entry.action) {
    case "upload":
      return uploadSummary(entry);
    case "create":
      return `Created ${resourceLabel(entry.resource).toLowerCase()}`;
    case "update":
      return updateSummary(entry, timeZone);
    case "delete": {
      const count = (m.count as number | undefined) ?? 1;
      const label = resourceLabel(entry.resource).toLowerCase();
      return count === 1 ? `Deleted ${label}` : `Deleted ${count} ${label}s`;
    }
    case "activate":
      return activateSummary(entry);
    case "resend_invite": {
      const sent = (m.sent as number | undefined) ?? 0;
      return `Resent ${sent} invite${sent === 1 ? "" : "s"}`;
    }
    default:
      return entry.action;
  }
}

// ── Diff ────────────────────────────────────────────────────────────────────

export type AuditDiffModel = {
  /** `diff` shows before → after; `values` shows one value column. */
  variant: "diff" | "values";
  /** Heading of the value column for `values`. */
  valuesLabel: string;
  rows: { field: string; before: string | null; after: string | null }[];
  unchanged: { field: string; value: string }[];
};

// Keys that describe the entry rather than a field of the record.
const CONTEXT_KEYS = new Set(["field", "before", "after", "diff", "counts"]);

function scalarRows(m: Metadata, timeZone?: string | null) {
  return Object.entries(m)
    .filter(([key, value]) => !CONTEXT_KEYS.has(key) && !isRecord(value))
    .map(([field, value]) => ({
      field,
      before: null,
      after: formatAuditValue(value, timeZone),
    }))
    .filter((row) => row.after !== null);
}

/**
 * Turns an entry's metadata into the rows of the expanded diff. Updates show
 * Field / Before / After with untouched fields behind "Show N unchanged";
 * creates, uploads and invites show their values; deletes show what was removed.
 */
export function buildAuditDiff(
  entry: Entry,
  timeZone?: string | null,
): AuditDiffModel {
  const m = meta(entry);
  const fmt = (value: unknown) => formatAuditValue(value, timeZone);
  const empty: AuditDiffModel = {
    variant: "values",
    valuesLabel: "Value",
    rows: [],
    unchanged: [],
  };

  // A single field changed: `{ field, before, after }` (check-ins, paid).
  if (typeof m.field === "string") {
    return {
      variant: "diff",
      valuesLabel: "Value",
      rows: [{ field: m.field, before: fmt(m.before), after: fmt(m.after) }],
      unchanged: [],
    };
  }

  // A precomputed diff: `{ diff: { field: { from, to } } }`.
  if (isRecord(m.diff)) {
    return {
      variant: "diff",
      valuesLabel: "Value",
      rows: Object.entries(m.diff).map(([field, change]) => {
        const c = isRecord(change) ? change : {};
        return { field, before: fmt(c.from), after: fmt(c.to) };
      }),
      unchanged: [],
    };
  }

  if (isRecord(m.counts)) {
    return {
      ...empty,
      rows: Object.entries(m.counts).map(([field, value]) => ({
        field,
        before: null,
        after: fmt(value),
      })),
    };
  }

  const before = isRecord(m.before) ? m.before : null;
  const after = isRecord(m.after) ? m.after : null;

  // Both sides recorded: the changed fields, then the rest as unchanged.
  if (before && after) {
    const rows: AuditDiffModel["rows"] = [];
    const unchanged: AuditDiffModel["unchanged"] = [];
    const keys = [
      ...Object.keys(before),
      ...Object.keys(after).filter((key) => !(key in before)),
    ];
    for (const field of keys) {
      const was = fmt(before[field]);
      if (field in after && fmt(after[field]) !== was) {
        rows.push({ field, before: was, after: fmt(after[field]) });
      } else if (was !== null) {
        unchanged.push({ field, value: was });
      }
    }
    return { variant: "diff", valuesLabel: "Value", rows, unchanged };
  }

  if (after) {
    return {
      ...empty,
      rows: Object.entries(after)
        .map(([field, value]) => ({ field, before: null, after: fmt(value) }))
        .filter((row) => row.after !== null),
    };
  }

  if (before) {
    return {
      variant: "values",
      valuesLabel: "Removed value",
      rows: Object.entries(before)
        .map(([field, value]) => ({ field, before: fmt(value), after: null }))
        .filter((row) => row.before !== null),
      unchanged: [],
    };
  }

  return { ...empty, rows: scalarRows(m, timeZone) };
}

/** "126 · Mary Miller", "Mary Miller", or null when the entry isn't about a dancer. */
export function subjectLabel(entry: AuditLogEntry): string | null {
  const subject = entry.subject;
  if (!subject) return null;
  const name = [subject.firstName, subject.lastName].filter(Boolean).join(" ");
  if (subject.bibNumber !== null && name)
    return `${subject.bibNumber} · ${name}`;
  if (subject.bibNumber !== null) return String(subject.bibNumber);
  return name || subject.email || null;
}

export function actorName(entry: Entry): string {
  return `${entry.actor.firstName} ${entry.actor.lastName}`.trim();
}
