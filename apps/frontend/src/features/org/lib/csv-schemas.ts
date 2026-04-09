export type CsvRosterType = "dancer" | "coach";

export interface CsvColumnSchema {
  key: string;
  label: string;
  required: boolean;
  /** Unique across rows — later duplicates get flagged as errors. */
  unique?: boolean;
  validate?: (value: string) => string | null;
}

export interface CsvSchema {
  type: CsvRosterType;
  label: string;
  uploadPath: (orgSlug: string, eventId: string) => string;
  columns: CsvColumnSchema[];
}

const emailValidator = (value: string): string | null => {
  if (!value) return null;
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return ok ? null : "invalid email";
};

const nonEmpty = (field: string) => (value: string): string | null =>
  value && value.trim().length > 0 ? null : `missing ${field}`;

const integerish = (field: string) => (value: string): string | null => {
  if (!value) return null;
  return /^\d+$/.test(value) ? null : `${field} must be a number`;
};

export const dancerSchema: CsvSchema = {
  type: "dancer",
  label: "dancer",
  uploadPath: (slug, eventId) => `/orgs/${slug}/events/${eventId}/upload/dancers`,
  columns: [
    {
      key: "email",
      label: "email",
      required: true,
      validate: (v) => nonEmpty("email")(v) ?? emailValidator(v),
    },
    { key: "firstName", label: "firstName", required: true, validate: nonEmpty("first name") },
    { key: "lastName", label: "lastName", required: true, validate: nonEmpty("last name") },
    {
      key: "bibNumber",
      label: "bibNumber",
      required: false,
      unique: true,
      validate: integerish("bib number"),
    },
  ],
};

export const coachSchema: CsvSchema = {
  type: "coach",
  label: "coach",
  uploadPath: (slug, eventId) => `/orgs/${slug}/events/${eventId}/upload/coaches`,
  columns: [
    {
      key: "email",
      label: "email",
      required: true,
      validate: (v) => nonEmpty("email")(v) ?? emailValidator(v),
    },
    { key: "firstName", label: "firstName", required: true, validate: nonEmpty("first name") },
    { key: "lastName", label: "lastName", required: true, validate: nonEmpty("last name") },
    { key: "organization", label: "organization", required: false },
  ],
};

export const schemaFor = (type: CsvRosterType): CsvSchema =>
  type === "dancer" ? dancerSchema : coachSchema;

export interface ParsedRow {
  index: number;
  values: Record<string, string>;
  errors: string[];
}

export interface DuplicateGroup {
  column: string;
  value: string;
  rows: number[];
}

export interface ParseResult {
  rows: ParsedRow[];
  totalRows: number;
  detectedColumns: string[];
  missingRequired: string[];
  warningsCount: number;
  validRowsCount: number;
  /** Unique-column collisions within the file. Blocks upload. */
  duplicates: DuplicateGroup[];
}

export function validateParsed(
  schema: CsvSchema,
  rows: Array<Record<string, string>>,
  detectedColumns: string[],
): ParseResult {
  const missingRequired = schema.columns
    .filter((c) => c.required && !detectedColumns.includes(c.key))
    .map((c) => c.key);

  const parsed: ParsedRow[] = rows.map((values, i) => {
    const errors: string[] = [];
    if (missingRequired.length === 0) {
      for (const col of schema.columns) {
        const value = values[col.key] ?? "";
        const err = col.validate?.(value);
        if (err) errors.push(`${col.label}: ${err}`);
      }
    }
    return { index: i + 1, values, errors };
  });

  // Cross-row pass: flag duplicate values for columns marked `unique`.
  // Every occurrence (including the first) gets a row-level error so the
  // user sees all of them in the preview table.
  const duplicates: DuplicateGroup[] = [];
  if (missingRequired.length === 0) {
    for (const col of schema.columns) {
      if (!col.unique) continue;
      const groups = new Map<string, number[]>();
      for (const r of parsed) {
        const raw = (r.values[col.key] ?? "").trim();
        if (!raw) continue;
        const list = groups.get(raw) ?? [];
        list.push(r.index);
        groups.set(raw, list);
      }
      for (const [value, rowNums] of groups) {
        if (rowNums.length < 2) continue;
        duplicates.push({ column: col.label, value, rows: rowNums });
        const dupSet = new Set(rowNums);
        for (const r of parsed) {
          if (dupSet.has(r.index)) {
            r.errors.push(
              `duplicate ${col.label} "${value}" (also on rows ${rowNums.filter((n) => n !== r.index).join(", ")})`,
            );
          }
        }
      }
    }
  }

  const warningsCount = parsed.filter((r) => r.errors.length > 0).length;
  const validRowsCount = parsed.length - warningsCount;

  return {
    rows: parsed,
    totalRows: parsed.length,
    detectedColumns,
    missingRequired,
    warningsCount,
    validRowsCount,
    duplicates,
  };
}
