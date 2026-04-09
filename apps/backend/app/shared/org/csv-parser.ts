import { parse } from "csv-parse/sync";

export interface CoachRow {
  email: string;
  firstName: string;
  lastName: string;
  organization: string;
}

export interface DancerRow {
  email: string;
  firstName: string;
  lastName: string;
  bibNumber: number;
  /** 1-based line number in the CSV file (header is row 1). */
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
    const result = validateRow(r, i + 2); // +2: row 1 is header
    if ("reason" in result && typeof (result as RowError).reason === "string") {
      errors.push(result as RowError);
    } else {
      rows.push(result as T);
    }
  });

  return { rows, errors };
}

export function parseCoachCsv(csv: string) {
  return parseCsv<CoachRow>(csv, (r, row) => {
    if (!r["email"]?.trim()) return { row, reason: "missing email" };
    if (!r["firstName"]?.trim()) return { row, reason: "missing firstName" };
    if (!r["lastName"]?.trim()) return { row, reason: "missing lastName" };
    if (!r["organization"]?.trim()) return { row, reason: "missing organization" };
    return {
      email: r["email"]!.toLowerCase().trim(),
      firstName: r["firstName"]!.trim(),
      lastName: r["lastName"]!.trim(),
      organization: r["organization"]!.trim(),
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
