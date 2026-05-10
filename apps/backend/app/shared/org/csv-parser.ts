import { parse } from "csv-parse/sync";
import { normalizeEmail } from "#utils/normalize-email";

export interface CoachRow {
  email: string;
  firstName: string;
  lastName: string;
  organization: string;
  /** 1-based index of the data row (header excluded). Row 1 = first dancer/coach. */
  csvRow: number;
}

export interface DancerRow {
  email: string;
  firstName: string;
  lastName: string;
  bibNumber: number;
  /** 1-based index of the data row (header excluded). Row 1 = first dancer/coach. */
  csvRow: number;
}

export interface RowError {
  row: number;
  reason: string;
}

function parseCsv<T extends object>(
  csv: string,
  validateRow: (r: Record<string, string>, rowNum: number) => T | RowError
): { rows: T[]; errors: RowError[] } {
  const raw = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const rows: T[] = [];
  const errors: RowError[] = [];

  raw.forEach((r, i) => {
    const result = validateRow(r, i + 1); // data-row index, 1-based (header excluded)
    if ("reason" in result && typeof (result as RowError).reason === "string") {
      errors.push(result as RowError);
    } else {
      rows.push(result as T);
    }
  });

  return { rows, errors };
}

/**
 * Batch-normalizes the `email` field on every parsed row using the same
 * vine normalizer as signup/login (`normalizeEmail`). Keeps the account
 * lookups aligned with `users.email` (which is stored normalized) — this
 * is what lets a CSV row `test+foo@gmail.com` match a user that signed
 * up as `test@gmail.com`.
 */
export async function normalizeRowEmails<T extends { email: string }>(
  rows: T[]
): Promise<T[]> {
  const normalized = await Promise.all(rows.map((r) => normalizeEmail(r.email)));
  return rows.map((r, i) => ({ ...r, email: normalized[i]! }));
}

export function parseCoachCsv(csv: string) {
  return parseCsv<CoachRow>(csv, (r, row) => {
    if (!r["email"]?.trim()) return { row, reason: "missing email" };
    if (!r["firstName"]?.trim()) return { row, reason: "missing firstName" };
    if (!r["lastName"]?.trim()) return { row, reason: "missing lastName" };
    if (!r["organization"]?.trim())
      return { row, reason: "missing organization" };
    return {
      email: r["email"]!.toLowerCase().trim(),
      firstName: r["firstName"]!.trim(),
      lastName: r["lastName"]!.trim(),
      organization: r["organization"]!.trim(),
      csvRow: row,
    };
  });
}

export function parseDancerCsv(csv: string) {
  return parseCsv<DancerRow>(csv, (r, row) => {
    if (!r["email"]?.trim()) return { row, reason: "missing email" };
    if (!r["firstName"]?.trim()) return { row, reason: "missing firstName" };
    if (!r["lastName"]?.trim()) return { row, reason: "missing lastName" };
    const bibRaw = r["bibNumber"] ?? r["bib_number"] ?? "";
    const bib = Number(bibRaw.trim());
    if (!bibRaw.trim() || Number.isNaN(bib) || !Number.isInteger(bib)) {
      return { row, reason: "missing or invalid bib number" };
    }
    return {
      email: r["email"]!.toLowerCase().trim(),
      firstName: r["firstName"]!.trim(),
      lastName: r["lastName"]!.trim(),
      bibNumber: bib,
      csvRow: row,
    };
  });
}
