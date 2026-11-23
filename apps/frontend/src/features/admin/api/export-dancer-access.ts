import { client } from "@/lib/api/client";

export interface DancerAccessExportSummary {
  filename: string;
  /** Data rows in the file, as the backend counted them. */
  rowCount: number | null;
  /** Rows whose access lookup failed; they say "unknown", never "free". */
  failedLookups: number | null;
}

const count = (value: string | null) => {
  if (value === null) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

/** The filename from `attachment; filename="..."`, or a dated fallback. */
export function exportFilename(disposition: string | null, now = new Date()) {
  const match = disposition?.match(/filename="([^"]+)"/);
  return match?.[1] ?? `dancer-access-${now.toISOString().slice(0, 10)}.csv`;
}

/**
 * Downloads every Dancer's emails and current access as a CSV. Admin only;
 * the backend refuses anyone else. Throws on any non-2xx so the caller never
 * saves an error page as a CSV.
 */
export async function downloadDancerAccessCsv(): Promise<DancerAccessExportSummary> {
  const res = await client.GET("/admin/dancers/access-export", {
    parseAs: "text",
    cache: "no-store",
  });

  if (!res.response.ok) {
    throw new Error(`Export failed (HTTP ${res.response.status})`);
  }

  const headers = res.response.headers;
  const filename = exportFilename(headers.get("content-disposition"));
  const csv = (res.data as unknown as string) ?? "";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return {
    filename,
    rowCount: count(headers.get("x-export-row-count")),
    failedLookups: count(headers.get("x-export-access-lookup-failures")),
  };
}
