export type CsvRosterType = "dancer" | "coach";

export interface CsvColumnSchema {
  key: string;
  label: string;
  required: boolean;
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
    { key: "bibNumber", label: "bibNumber", required: false, validate: integerish("bib number") },
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

export interface ParseResult {
  rows: ParsedRow[];
  totalRows: number;
  detectedColumns: string[];
  missingRequired: string[];
  warningsCount: number;
  validRowsCount: number;
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

  const warningsCount = parsed.filter((r) => r.errors.length > 0).length;
  const validRowsCount = parsed.length - warningsCount;

  return {
    rows: parsed,
    totalRows: parsed.length,
    detectedColumns,
    missingRequired,
    warningsCount,
    validRowsCount,
  };
}
