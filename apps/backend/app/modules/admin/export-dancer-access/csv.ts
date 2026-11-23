/**
 * Cell values that a spreadsheet would run as a formula when the CSV is
 * opened: a leading =, +, -, @, tab or carriage return. Such a cell gets a
 * leading apostrophe so it is shown as text (OWASP "CSV injection").
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export type CsvCell = string | number | boolean | Date | null | undefined;

export function csvCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";

  let text = value instanceof Date ? value.toISOString() : String(value);

  if (typeof value === "string" && FORMULA_START.test(text)) {
    text = `'${text}`;
  }

  return /[",\r\n]/.test(text) || text !== text.trim()
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

/** RFC 4180 rows: comma separated, CRLF line endings, a final CRLF. */
export function toCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
