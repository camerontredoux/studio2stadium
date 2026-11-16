import type {
  SuppressionReason,
  SuppressionSource,
} from "#database/schema/week-pass-emails";

/**
 * The three exports `node ace email-suppressions:import` accepts.
 *
 * - sender: Sender's contact export, a JSON array of
 *   `{ email, status: { email, temail }, unsubscribed_at, bounced_at }`.
 *   `status.email` (the marketing channel's status) is the reason;
 *   `status.temail` is not read.
 * - ses: the SES account suppression list, a JSON array of
 *   `{ EmailAddress, LastUpdateTime, Reason }`, or the AWS CLI's
 *   `{ SuppressedDestinationSummaries: [...] }` wrapper around it.
 * - removals: explicit removal requests, plain text, one address per line.
 *   Blank lines and lines starting with `#` are skipped.
 */
export type SuppressionFormat = "sender" | "ses" | "removals";
export const SUPPRESSION_FORMATS: SuppressionFormat[] = [
  "sender",
  "ses",
  "removals",
];

export interface SuppressionRecord {
  email: string;
  source: SuppressionSource;
  reason: SuppressionReason;
  sourceRecordedAt: Date | null;
}

/**
 * A problem with one entry. `entry` is the 1-based array index or line
 * number. Never carries the address itself, so it is safe to print.
 */
export interface SuppressionProblem {
  entry: number;
  problem: string;
}

export interface ParsedSuppressions {
  /** Entries read, before de-duplication. */
  entries: number;
  /** One per address, valid only when `problems` is empty. */
  records: SuppressionRecord[];
  /** Entries for an address already seen earlier in the same file. */
  duplicates: number;
  problems: SuppressionProblem[];
}

const SENDER_REASONS: Record<string, SuppressionReason> = {
  unsubscribed: "unsubscribed",
  bounced: "bounced",
  spam_reported: "complained",
};

const SES_REASONS: Record<string, SuppressionReason> = {
  BOUNCE: "bounced",
  COMPLAINT: "complained",
};

/**
 * Trim and lowercase. Matching is case-insensitive anyway (`citext`), so
 * lowercasing only keeps the stored form consistent.
 */
export function normalizeAddress(raw: string): string {
  return raw.normalize("NFC").trim().toLowerCase();
}

// One @, a local part and a dotted domain, no whitespace or angle brackets,
// within the 254-character limit. Deliberately plain: the goal is to reject
// export garbage, not to judge deliverability.
const ADDRESS = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]+$/;

export function isValidAddress(address: string): boolean {
  return address.length <= 254 && ADDRESS.test(address);
}

function parseTimestamp(value: unknown): Date | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    // Epoch seconds, as some exports write them.
    return new Date(value * 1000);
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type Entry =
  | { ok: true; record: SuppressionRecord }
  | { ok: false; problem: string };

function senderEntry(item: unknown): Entry {
  if (!isObject(item)) return { ok: false, problem: "not an object" };
  if (typeof item.email !== "string") {
    return { ok: false, problem: "email is missing or not a string" };
  }
  if (!isObject(item.status) || typeof item.status.email !== "string") {
    return { ok: false, problem: "status.email is missing" };
  }
  const reason = SENDER_REASONS[item.status.email];
  if (!reason) {
    return {
      ok: false,
      problem: `status.email is not bounced, unsubscribed or spam_reported`,
    };
  }
  const unsubscribedAt = parseTimestamp(item.unsubscribed_at);
  const bouncedAt = parseTimestamp(item.bounced_at);
  if (unsubscribedAt === undefined) {
    return { ok: false, problem: "unsubscribed_at is not a date or null" };
  }
  if (bouncedAt === undefined) {
    return { ok: false, problem: "bounced_at is not a date or null" };
  }
  return {
    ok: true,
    record: {
      email: normalizeAddress(item.email),
      source: "sender",
      reason,
      sourceRecordedAt:
        reason === "bounced"
          ? (bouncedAt ?? unsubscribedAt)
          : (unsubscribedAt ?? bouncedAt),
    },
  };
}

function sesEntry(item: unknown): Entry {
  if (!isObject(item)) return { ok: false, problem: "not an object" };
  if (typeof item.EmailAddress !== "string") {
    return { ok: false, problem: "EmailAddress is missing or not a string" };
  }
  const reason =
    typeof item.Reason === "string" ? SES_REASONS[item.Reason] : undefined;
  if (!reason) {
    return { ok: false, problem: "Reason is not BOUNCE or COMPLAINT" };
  }
  const updatedAt = parseTimestamp(item.LastUpdateTime);
  if (updatedAt === undefined) {
    return { ok: false, problem: "LastUpdateTime is not a date" };
  }
  return {
    ok: true,
    record: {
      email: normalizeAddress(item.EmailAddress),
      source: "ses",
      reason,
      sourceRecordedAt: updatedAt,
    },
  };
}

function collect(
  entries: { entry: number; result: Entry }[]
): ParsedSuppressions {
  const problems: SuppressionProblem[] = [];
  const byAddress = new Map<string, SuppressionRecord>();
  let duplicates = 0;

  for (const { entry, result } of entries) {
    if (!result.ok) {
      problems.push({ entry, problem: result.problem });
      continue;
    }
    if (!isValidAddress(result.record.email)) {
      problems.push({ entry, problem: "not a valid email address" });
      continue;
    }
    const seen = byAddress.get(result.record.email);
    if (seen) {
      duplicates++;
      // Keep the most recent statement about the address.
      const seenAt = seen.sourceRecordedAt?.getTime() ?? -Infinity;
      const thisAt = result.record.sourceRecordedAt?.getTime() ?? -Infinity;
      if (thisAt > seenAt) byAddress.set(result.record.email, result.record);
      continue;
    }
    byAddress.set(result.record.email, result.record);
  }

  return {
    entries: entries.length,
    records: problems.length === 0 ? [...byAddress.values()] : [],
    duplicates,
    problems,
  };
}

function jsonArray(
  contents: string,
  unwrap?: string
): { items: unknown[] } | { problem: string } {
  let data: unknown;
  try {
    data = JSON.parse(contents);
  } catch {
    return { problem: "the file is not valid JSON" };
  }
  if (unwrap && isObject(data) && Array.isArray(data[unwrap])) {
    data = data[unwrap];
  }
  if (!Array.isArray(data)) {
    return { problem: "the file is not a JSON array" };
  }
  return { items: data };
}

/**
 * Read and validate a whole export. Any problem anywhere means no records:
 * the import applies a file completely or not at all.
 */
export function parseSuppressions(
  format: SuppressionFormat,
  contents: string
): ParsedSuppressions {
  if (format === "removals") {
    const entries = contents
      .split(/\r?\n/)
      .map((line, index) => ({ line: line.trim(), entry: index + 1 }))
      .filter(({ line }) => line !== "" && !line.startsWith("#"))
      .map(({ line, entry }) => ({
        entry,
        result: {
          ok: true as const,
          record: {
            email: normalizeAddress(line),
            source: "manual" as const,
            reason: "removal_requested" as const,
            sourceRecordedAt: null,
          },
        },
      }));
    return collect(entries);
  }

  const parsed = jsonArray(
    contents,
    format === "ses" ? "SuppressedDestinationSummaries" : undefined
  );
  if ("problem" in parsed) {
    return {
      entries: 0,
      records: [],
      duplicates: 0,
      problems: [{ entry: 0, problem: parsed.problem }],
    };
  }
  const read = format === "sender" ? senderEntry : sesEntry;
  return collect(
    parsed.items.map((item, index) => ({
      entry: index + 1,
      result: read(item),
    }))
  );
}
