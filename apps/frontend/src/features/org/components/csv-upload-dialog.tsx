import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/components/utils/cn";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminQueries } from "@/features/org/api/admin-queries";
import { client } from "@/lib/api/client";
import {
  schemaFor,
  validateParsed,
  type CsvRosterType,
  type ParseResult,
} from "@/features/org/lib/csv-schemas";
import Papa from "papaparse";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileSpreadsheetIcon,
  UploadCloudIcon,
  XCircleIcon,
} from "lucide-react";

type UploadResult = {
  rowsAdded: number;
  rowsUpdated: number;
  rowsErrored: number;
  errors: Array<{ row: number; reason: string }>;
};

type DialogStep =
  | { name: "idle" }
  | {
      name: "preview";
      file: File;
      parse: ParseResult;
      fileSize: number;
    }
  | {
      name: "error";
      file: File;
      parse: ParseResult;
      fileSize: number;
    }
  | { name: "uploading" }
  | { name: "done"; result: UploadResult };

interface CsvUploadDialogProps {
  orgSlug: string;
  eventId: string;
  type: CsvRosterType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CsvUploadDialog({
  orgSlug,
  eventId,
  type,
  open,
  onOpenChange,
}: CsvUploadDialogProps) {
  const schema = useMemo(() => schemaFor(type), [type]);
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<DialogStep>({ name: "idle" });
  const [isDragging, setIsDragging] = useState(false);

  const reset = useCallback(() => {
    setStep({ name: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset],
  );

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const raw = client as unknown as {
        POST: (path: string, opts: { body: FormData }) => Promise<{ data: UploadResult }>;
      };
      const res = await raw.POST(schema.uploadPath(orgSlug, eventId), {
        body: form,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setStep({ name: "done", result: data });
      qc.invalidateQueries(adminQueries.stats(orgSlug, eventId));
    },
    onError: () => {
      setStep({ name: "idle" });
    },
  });

  const handleFile = useCallback(
    (file: File) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: "greedy",
        preview: 500,
        complete: (results) => {
          const detected = results.meta.fields ?? [];
          const rows = (results.data ?? []).slice(0, 500);
          const parse = validateParsed(schema, rows, detected);
          if (parse.missingRequired.length > 0) {
            setStep({
              name: "error",
              file,
              parse,
              fileSize: file.size,
            });
          } else {
            setStep({
              name: "preview",
              file,
              parse,
              fileSize: file.size,
            });
          }
        },
        error: () => {
          setStep({ name: "idle" });
        },
      });
    },
    [schema],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const title =
    step.name === "done"
      ? "Upload complete"
      : `Upload ${schema.label} roster`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {step.name === "preview" || step.name === "error" ? (
            <DialogDescription>
              {step.file.name} · {step.parse.totalRows.toLocaleString()} rows
              detected · {formatBytes(step.fileSize)}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6 pb-2">
          {step.name === "idle" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/20",
              )}
            >
              <UploadCloudIcon className="text-muted-foreground size-10" />
              <div className="flex flex-col gap-1">
                <p className="font-medium">Drop a CSV file here</p>
                <p className="text-muted-foreground text-xs">
                  Required columns:{" "}
                  {schema.columns
                    .filter((c) => c.required)
                    .map((c) => c.key)
                    .join(", ")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose file
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={onPick}
              />
            </div>
          )}

          {step.name === "preview" && <PreviewView step={step} />}
          {step.name === "error" && <ErrorView step={step} onReset={reset} />}
          {step.name === "uploading" && <UploadingView />}
          {step.name === "done" && <ResultView result={step.result} />}
        </div>

        <DialogFooter>
          {step.name === "idle" && (
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}
          {step.name === "preview" && (
            <>
              <Button variant="ghost" onClick={reset}>
                Choose different file
              </Button>
              <Button
                onClick={() => {
                  setStep({ name: "uploading" });
                  upload.mutate(step.file);
                }}
                disabled={step.parse.validRowsCount === 0}
              >
                Upload {step.parse.validRowsCount.toLocaleString()} rows
              </Button>
            </>
          )}
          {step.name === "error" && (
            <Button variant="outline" onClick={reset}>
              Choose different file
            </Button>
          )}
          {step.name === "uploading" && (
            <Button disabled variant="outline">
              <Spinner className="mr-2" />
              Uploading...
            </Button>
          )}
          {step.name === "done" && (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewView({
  step,
}: {
  step: Extract<DialogStep, { name: "preview" }>;
}) {
  const previewRows = step.parse.rows.slice(0, 10);
  const columns = step.parse.detectedColumns;

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
          <CheckCircle2Icon className="size-3.5" />
          Columns matched
        </span>
        {step.parse.warningsCount > 0 && (
          <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
            <AlertTriangleIcon className="size-3.5" />
            {step.parse.warningsCount} row
            {step.parse.warningsCount === 1 ? "" : "s"} skipped
          </span>
        )}
      </div>

      <div className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
        Preview · first 10 of {step.parse.totalRows.toLocaleString()} rows
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 sticky top-0">
            <tr>
              <th className="text-muted-foreground w-8 px-2 py-1.5 text-left font-medium">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="text-muted-foreground px-2 py-1.5 text-left font-medium"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row) => (
              <tr
                key={row.index}
                className={cn(
                  "border-t transition-colors",
                  row.errors.length > 0
                    ? "bg-amber-500/5 hover:bg-amber-500/10"
                    : "hover:bg-muted/30",
                )}
              >
                <td className="text-muted-foreground w-8 px-2 py-1.5 font-mono">
                  {row.errors.length > 0 ? (
                    <AlertTriangleIcon className="size-3 text-amber-500" />
                  ) : (
                    row.index
                  )}
                </td>
                {columns.map((col) => (
                  <td
                    key={col}
                    className="max-w-[180px] truncate px-2 py-1.5"
                    title={row.values[col] ?? ""}
                  >
                    {row.values[col] ?? (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground text-xs">
        Showing 10 of {step.parse.totalRows.toLocaleString()} ·{" "}
        {step.parse.validRowsCount.toLocaleString()} rows will upload
      </p>
    </div>
  );
}

function ErrorView({
  step,
  onReset,
}: {
  step: Extract<DialogStep, { name: "error" }>;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-center gap-2">
        <XCircleIcon className="text-destructive size-5" />
        <span className="font-semibold">
          This file doesn't look right
        </span>
      </div>
      <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
        {step.parse.missingRequired.map((col) => (
          <li key={col}>
            Missing required column: <code className="font-mono">{col}</code>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">
        Detected columns: {step.parse.detectedColumns.join(", ") || "none"}
      </p>
      <Button size="sm" variant="outline" onClick={onReset}>
        Choose different file
      </Button>
    </div>
  );
}

function UploadingView() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <FileSpreadsheetIcon className="text-muted-foreground size-12 animate-pulse" />
      <div className="bg-muted relative h-1.5 w-full max-w-sm overflow-hidden rounded-full">
        <div className="bg-primary absolute inset-y-0 left-0 w-1/3 animate-[shimmer_1.4s_infinite_ease-in-out] rounded-full" />
      </div>
      <p className="text-muted-foreground text-sm">Uploading to server…</p>
    </div>
  );
}

function ResultView({ result }: { result: UploadResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2Icon className="size-5" />
        <span className="font-semibold">Roster processed</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <ResultStat value={result.rowsAdded} label="added" tone="success" />
        <ResultStat value={result.rowsUpdated} label="updated" tone="default" />
        <ResultStat
          value={result.rowsErrored}
          label="errored"
          tone={result.rowsErrored > 0 ? "error" : "default"}
        />
      </div>
      {result.errors.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Errors
          </div>
          <div className="max-h-40 overflow-auto rounded-lg border">
            <table className="w-full text-xs">
              <tbody>
                {result.errors.map((err, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="text-muted-foreground w-12 px-2 py-1.5 font-mono">
                      {err.row}
                    </td>
                    <td className="px-2 py-1.5">{err.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultStat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "success" | "error" | "default";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border py-4",
        tone === "success" && "border-emerald-500/30 bg-emerald-500/5",
        tone === "error" && "border-destructive/30 bg-destructive/5",
      )}
    >
      <span className="text-3xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}
