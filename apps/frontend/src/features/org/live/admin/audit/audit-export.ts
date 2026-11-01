import type { AuditLogEntry } from "@/features/org/api/audit-queries";

import {
  ACTION_LABELS,
  actorName,
  displayAction,
  RESOURCE_LABELS,
  subjectLabel,
  summarizeEntry,
} from "./audit-format";

const HEADER = [
  "Timestamp",
  "Actor",
  "Action",
  "Resource",
  "Resource ID",
  "Dancer",
  "Summary",
];

/**
 * One CSV field. Quotes values with commas, quotes or line breaks, and puts a
 * `'` before values a spreadsheet would run as a formula.
 */
export function csvField(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** The audit entries as CSV (RFC 4180, CRLF line ends), one row per entry. */
export function auditCsv(
  entries: readonly AuditLogEntry[],
  timeZone?: string | null,
): string {
  const rows = entries.map((entry) => [
    new Date(entry.createdAt).toISOString(),
    actorName(entry),
    ACTION_LABELS[displayAction(entry)],
    RESOURCE_LABELS[entry.resource] ?? entry.resource,
    entry.resourceId,
    subjectLabel(entry),
    summarizeEntry(entry, timeZone),
  ]);
  return [HEADER, ...rows]
    .map((row) => row.map(csvField).join(","))
    .join("\r\n");
}

/** "audit-log-the-summit-2026-2026-10-24.csv" */
export function auditCsvFilename(eventName: string | null, now: Date): string {
  const slug = (eventName ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const day = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return ["audit-log", slug, day].filter(Boolean).join("-") + ".csv";
}

/** Saves text as a CSV file through a temporary download link. */
export function downloadCsv(filename: string, csv: string) {
  // The byte-order mark makes Excel read the file as UTF-8.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
