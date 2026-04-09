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
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminQueries } from "@/features/org/api/admin-queries";
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
  FileTextIcon,
  MailIcon,
  MousePointerClickIcon,
  RefreshCwIcon,
  UserCheckIcon,
  XCircleIcon,
} from "lucide-react";
import type { CsvSchema } from "@/features/org/lib/csv-schemas";

type UploadResult = {
  rowsAdded: number;
  rowsUpdated: number;
  rowsErrored: number;
  errors: Array<{ row: number; reason: string }>;
};

type ServerPreview = {
  totalRows: number;
  willMatch: number;
  willInvite: number;
  willUpdate: number;
  willError: number;
};

type DialogStep =
  | { name: "idle" }
  | {
      name: "preview";
      file: File;
      parse: ParseResult;
      fileSize: number;
      serverPreview: ServerPreview | null;
      serverPreviewPending: boolean;
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

  async function postForm<T>(path: string, file: File): Promise<T> {
    const form = new FormData();
    form.append("file", file);
    const baseUrl = (import.meta.env.VITE_API_URL as string) ?? "";
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.message) message += `: ${body.message}`;
        else if (body?.errors?.[0]?.message)
          message += `: ${body.errors[0].message}`;
      } catch {
        // ignore body parse errors
      }
      if (res.status === 401) window.location.href = "/login";
      throw new Error(message);
    }
    return (await res.json()) as T;
  }

  const upload = useMutation({
    mutationFn: (file: File) =>
      postForm<UploadResult>(schema.uploadPath(orgSlug, eventId), file),
    onSuccess: (data) => {
      setStep({ name: "done", result: data });
      qc.invalidateQueries(adminQueries.stats(orgSlug, eventId));
    },
    onError: (err) => {
      console.error("csv upload failed", err);
      toastManager.add({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Try again",
        type: "error",
      });
      setStep({ name: "idle" });
    },
  });

  const previewMutation = useMutation({
    mutationFn: (file: File) => {
      const pathSegment =
        schema.type === "dancer" ? "dancers" : "coaches";
      const path = `/orgs/${orgSlug}/events/${eventId}/upload/${pathSegment}/preview`;
      return postForm<ServerPreview>(path, file);
    },
    onSuccess: (data) => {
      setStep((current) =>
        current.name === "preview"
          ? { ...current, serverPreview: data, serverPreviewPending: false }
          : current,
      );
    },
    onError: (err) => {
      console.error("csv preview failed", err);
      setStep((current) =>
        current.name === "preview"
          ? { ...current, serverPreview: null, serverPreviewPending: false }
          : current,
      );
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
              serverPreview: null,
              serverPreviewPending: true,
            });
            previewMutation.mutate(file);
          }
        },
        error: () => {
          setStep({ name: "idle" });
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schema],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    // Reset so that picking the same file again re-triggers onChange.
    e.target.value = "";
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

        <div className="flex flex-1 flex-col gap-5 overflow-hidden px-6 pb-6">
          <StepIndicator step={step.name} />

          {step.name === "idle" && (
            <IdleView
              schema={schema}
              isDragging={isDragging}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onPickClick={() => fileInputRef.current?.click()}
            />
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onPick}
          />

          {step.name === "preview" && (
            <PreviewView step={step} schema={schema} />
          )}
          {step.name === "error" && (
            <ErrorView step={step} schema={schema} onReset={reset} />
          )}
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
                disabled={
                  step.parse.validRowsCount === 0 ||
                  step.parse.duplicates.length > 0 ||
                  step.serverPreviewPending
                }
              >
                {step.parse.duplicates.length > 0
                  ? `Fix ${step.parse.duplicates.length} duplicate${step.parse.duplicates.length === 1 ? "" : "s"} to continue`
                  : step.serverPreview && step.serverPreview.willInvite > 0
                    ? `Upload & send ${step.serverPreview.willInvite.toLocaleString()} invites`
                    : `Upload ${step.parse.validRowsCount.toLocaleString()} rows`}
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
  schema,
}: {
  step: Extract<DialogStep, { name: "preview" }>;
  schema: CsvSchema;
}) {
  const previewRows = step.parse.rows.slice(0, 10);
  const columns = step.parse.detectedColumns;

  const hasDuplicates = step.parse.duplicates.length > 0;

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
      {hasDuplicates ? (
        <DuplicateBanner duplicates={step.parse.duplicates} />
      ) : (
        <ImpactSummary
          pending={step.serverPreviewPending}
          preview={step.serverPreview}
          kind={schema.type}
        />
      )}

      <ColumnChips
        schema={schema}
        detectedColumns={step.parse.detectedColumns}
        warningsCount={step.parse.warningsCount}
      />


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
  schema,
  onReset,
}: {
  step: Extract<DialogStep, { name: "error" }>;
  schema: CsvSchema;
  onReset: () => void;
}) {
  void schema;
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
  const added = result?.rowsAdded ?? 0;
  const updated = result?.rowsUpdated ?? 0;
  const errored = result?.rowsErrored ?? 0;
  const errors = result?.errors ?? [];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2Icon className="size-5" />
        <span className="font-semibold">Roster processed</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <ResultStat value={added} label="added" tone="success" />
        <ResultStat value={updated} label="updated" tone="default" />
        <ResultStat
          value={errored}
          label="errored"
          tone={errored > 0 ? "error" : "default"}
        />
      </div>
      {errors.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-[11px] font-semibold tracking-wider uppercase">
            Errors
          </div>
          <div className="max-h-40 overflow-auto rounded-lg border">
            <table className="w-full text-xs">
              <tbody>
                {errors.map((err, i) => (
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

function StepIndicator({ step }: { step: DialogStep["name"] }) {
  const steps: Array<{ id: DialogStep["name"]; label: string }> = [
    { id: "idle", label: "Select" },
    { id: "preview", label: "Review" },
    { id: "uploading", label: "Upload" },
    { id: "done", label: "Done" },
  ];
  const activeIndex =
    step === "error" ? 0 : steps.findIndex((s) => s.id === step);

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold tabular-nums transition-colors",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground",
                  isDone && "border-emerald-500 bg-emerald-500 text-white",
                  !isActive &&
                    !isDone &&
                    "border-border text-muted-foreground",
                )}
              >
                {isDone ? <CheckCircle2Icon className="size-3" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium tracking-wide uppercase transition-colors",
                  isActive && "text-foreground",
                  isDone && "text-emerald-700 dark:text-emerald-400",
                  !isActive && !isDone && "text-muted-foreground/60",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-6 transition-colors",
                  i < activeIndex ? "bg-emerald-500/60" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function IdleView({
  schema,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onPickClick,
}: {
  schema: CsvSchema;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onPickClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div
        role="button"
        tabIndex={0}
        onClick={onPickClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPickClick();
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "group relative flex min-h-[240px] w-full cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/80 bg-gradient-to-b from-muted/20 to-muted/40 hover:border-primary/50 hover:from-primary/5 hover:to-primary/10",
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--color-primary),transparent_60%)] transition-opacity duration-300",
            isDragging
              ? "opacity-[0.10]"
              : "opacity-0 group-hover:opacity-[0.06]",
          )}
        />

        <div
          className={cn(
            "relative h-16 w-20 transition-transform duration-300",
            isDragging && "scale-110",
            "group-hover:-translate-y-0.5",
          )}
        >
          <div
            className={cn(
              "bg-card border-border/60 absolute inset-x-3 top-2 flex h-14 items-center justify-center rounded-lg border shadow-sm transition-transform duration-300",
              "-rotate-6",
              isDragging && "-rotate-12 -translate-x-2",
            )}
            aria-hidden="true"
          >
            <FileTextIcon className="text-muted-foreground/40 size-5" />
          </div>
          <div
            className={cn(
              "bg-card border-border/60 absolute inset-x-3 top-1 flex h-14 items-center justify-center rounded-lg border shadow-sm transition-transform duration-300",
              "rotate-3",
              isDragging && "rotate-6 translate-x-2",
            )}
            aria-hidden="true"
          >
            <FileTextIcon className="text-muted-foreground/60 size-5" />
          </div>
          <div className="bg-card border-primary/30 absolute inset-x-3 top-0 flex h-14 items-center justify-center rounded-lg border-2 shadow-md">
            <FileSpreadsheetIcon className="text-primary size-6" />
          </div>
        </div>

        <div className="relative flex flex-col gap-1">
          <p className="text-base font-semibold">
            {isDragging ? "Release to upload" : "Drop your CSV file here"}
          </p>
          <p className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
            <MousePointerClickIcon className="size-3" />
            or click anywhere to browse
          </p>
        </div>
      </div>

      <ExpectedColumns schema={schema} />
    </div>
  );
}

function ExpectedColumns({
  schema,
  detected = [],
}: {
  schema: CsvSchema;
  detected?: string[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
        Expected columns
      </span>
      <div className="flex flex-wrap gap-1.5">
        {schema.columns.map((col) => {
          const isMatched = detected.includes(col.key);
          return (
            <span
              key={col.key}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors",
                isMatched
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : col.required
                    ? "border-border/80 bg-background text-foreground/80"
                    : "border-dashed border-border/60 bg-transparent text-muted-foreground",
              )}
            >
              {isMatched && <CheckCircle2Icon className="size-3" />}
              {col.key}
              {!col.required && (
                <span className="text-muted-foreground/60">?</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function DuplicateBanner({
  duplicates,
}: {
  duplicates: Array<{ column: string; value: string; rows: number[] }>;
}) {
  return (
    <div className="border-destructive/30 bg-destructive/5 flex flex-col gap-2 rounded-xl border p-3">
      <div className="text-destructive flex items-center gap-2 text-sm font-semibold">
        <XCircleIcon className="size-4" />
        {duplicates.length} duplicate {duplicates[0]?.column ?? "value"}
        {duplicates.length === 1 ? "" : "s"} in this file
      </div>
      <p className="text-muted-foreground text-xs">
        Fix the file and re-upload. Uploads are blocked until every{" "}
        {duplicates[0]?.column ?? "value"} is unique.
      </p>
      <ul className="flex max-h-20 flex-col gap-0.5 overflow-auto font-mono text-[11px]">
        {duplicates.slice(0, 5).map((d) => (
          <li key={`${d.column}-${d.value}`} className="text-foreground/80">
            <span className="text-destructive font-semibold">{d.value}</span>{" "}
            <span className="text-muted-foreground">
              — rows {d.rows.join(", ")}
            </span>
          </li>
        ))}
        {duplicates.length > 5 && (
          <li className="text-muted-foreground">
            …and {duplicates.length - 5} more
          </li>
        )}
      </ul>
    </div>
  );
}

function ImpactSummary({
  pending,
  preview,
  kind,
}: {
  pending: boolean;
  preview: ServerPreview | null;
  kind: "dancer" | "coach";
}) {
  if (pending) {
    return (
      <div className="border-border/60 bg-muted/20 flex items-center gap-3 rounded-xl border p-3">
        <div className="bg-muted-foreground/20 size-8 animate-pulse rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <div className="bg-muted-foreground/20 h-3 w-32 animate-pulse rounded" />
          <div className="bg-muted-foreground/10 h-2 w-48 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  const hasInvites = preview.willInvite > 0;

  return (
    <div
      className={cn(
        "grid gap-2 sm:grid-cols-3",
        hasInvites && "sm:grid-cols-3",
      )}
    >
      <ImpactCard
        icon={<UserCheckIcon className="size-4" />}
        value={preview.willMatch}
        label={`existing ${kind}${preview.willMatch === 1 ? "" : "s"}`}
        hint="already on S2S"
        tone="success"
      />
      <ImpactCard
        icon={<MailIcon className="size-4" />}
        value={preview.willInvite}
        label={`invite email${preview.willInvite === 1 ? "" : "s"}`}
        hint={hasInvites ? "will send on upload" : "none needed"}
        tone={hasInvites ? "warn" : "muted"}
      />
      <ImpactCard
        icon={<RefreshCwIcon className="size-4" />}
        value={preview.willUpdate}
        label="existing roster rows"
        hint={preview.willUpdate > 0 ? "will update in place" : "none"}
        tone="muted"
      />
    </div>
  );
}

function ImpactCard({
  icon,
  value,
  label,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  hint: string;
  tone: "success" | "warn" | "muted";
}) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 overflow-hidden rounded-xl border p-3",
        tone === "success" && "border-emerald-500/30 bg-emerald-500/5",
        tone === "warn" && "border-amber-500/40 bg-amber-500/5",
        tone === "muted" && "border-border/60 bg-muted/20",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          tone === "success" &&
            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
          tone === "warn" &&
            "bg-amber-500/15 text-amber-700 dark:text-amber-400",
          tone === "muted" && "text-muted-foreground bg-muted-foreground/10",
        )}
      >
        {icon}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-lg leading-none font-semibold tabular-nums">
          {value.toLocaleString()}{" "}
          <span className="text-muted-foreground text-xs font-normal">
            {label}
          </span>
        </span>
        <span className="text-muted-foreground mt-0.5 truncate text-[11px]">
          {hint}
        </span>
      </div>
    </div>
  );
}

function ColumnChips({
  schema,
  detectedColumns,
  warningsCount,
}: {
  schema: CsvSchema;
  detectedColumns: string[];
  warningsCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {schema.columns.map((col) => {
        const isMatched = detectedColumns.includes(col.key);
        return (
          <span
            key={col.key}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px]",
              isMatched
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-border/60 text-muted-foreground",
            )}
          >
            {isMatched && <CheckCircle2Icon className="size-3" />}
            {col.key}
          </span>
        );
      })}
      {warningsCount > 0 && (
        <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
          <AlertTriangleIcon className="size-3" />
          {warningsCount} skipped
        </span>
      )}
    </div>
  );
}
