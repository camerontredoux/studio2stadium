import {
  ArrowsClockwiseIcon,
  CheckIcon,
  CloudArrowUpIcon,
  EnvelopeSimpleIcon,
  FileCsvIcon,
  UserCheckIcon,
  WarningIcon,
  XCircleIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import { useCallback, useMemo, useRef, useState } from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { Icon } from "@/components/event/icon";
import { Tag } from "@/components/event/tag";
import { BusyLabel } from "@/features/org/live/shared/busy-label";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import { useOrg } from "@/features/org/context/use-org";
import type { CsvSchema } from "@/features/org/lib/csv-schemas";
import {
  schemaFor,
  validateParsed,
  type CsvRosterType,
  type ParseResult,
} from "@/features/org/lib/csv-schemas";
import type { ApiSchemas } from "@/lib/api/client";

const ERROR_REASON_LABELS: Record<string, string> = {
  "cross-role-school":
    "Email belongs to a school account — remove from dancer roster",
  "cross-role-dancer":
    "Email belongs to a dancer account — remove from coach roster",
  "cross-role-pending-school":
    "Email has a pending school invite — cannot also be a dancer",
  "cross-role-pending-dancer":
    "Email has a pending dancer invite — cannot also be a coach",
  "bib-collision":
    "Bib number already assigned to another dancer in this event",
  "duplicate-in-file": "Duplicate entry in this file",
  "missing-required": "Missing required field",
  errors_present: "File contains errors that must be fixed before uploading",
};

function formatErrorReason(reason: string): string {
  return ERROR_REASON_LABELS[reason] ?? reason;
}

type UploadResult = {
  rowsAdded: number;
  rowsUpdated: number;
  rowsErrored: number;
  /** Rows in inserted batch where userId IS NOT NULL (activated immediately) */
  rowsActivated?: number;
  /** Rows in inserted batch where userId IS NULL (pending invite) */
  rowsPending?: number;
  errors: Array<{ row: number; reason: string }>;
};

type ServerPreview = ApiSchemas["OrgsIdEventsIdUploadIdPreviewResponse"];

function previewRowCounts(
  parse: ParseResult,
  serverPreview: ServerPreview | null,
  serverPreviewPending: boolean,
): { totalRows: number; acceptedRows: number } {
  if (serverPreview && !serverPreviewPending) {
    return {
      totalRows: serverPreview.totalRows,
      acceptedRows: serverPreview.acceptedRows ?? serverPreview.totalRows,
    };
  }
  return {
    totalRows: parse.totalRows,
    acceptedRows: parse.validRowsCount,
  };
}

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
  const { hasFeature } = useOrg();
  const freeTier = hasFeature("freeTierUsers");
  const schema = useMemo(() => schemaFor(type, { freeTier }), [type, freeTier]);
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

  async function postForm<T>(
    path: string,
    file: File,
    extra?: Record<string, string>,
  ): Promise<T> {
    const form = new FormData();
    form.append("file", file);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) form.append(k, v);
    }
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
        if (body?.message) message = body.message;
        else if (body?.errors?.[0]?.message) message = body.errors[0].message;
        else if (body?.errors?.[0]?.reason) message = body.errors[0].reason;
      } catch {
        // ignore body parse errors
      }
      if (res.status === 401) window.location.href = "/login";
      throw new Error(message);
    }
    return (await res.json()) as T;
  }

  const upload = useMutation({
    mutationFn: ({
      file,
      previewToken,
    }: {
      file: File;
      previewToken?: string;
    }) =>
      postForm<UploadResult>(
        schema.uploadPath(orgSlug, eventId),
        file,
        previewToken ? { previewToken } : undefined,
      ),
    onSuccess: (data) => {
      setStep({ name: "done", result: data });
      qc.invalidateQueries({
        queryKey: ["get", "/orgs/{slug}/events/{id}/rosters"],
      });
      qc.invalidateQueries({
        queryKey: ["get", "/orgs/{slug}/events/{id}/rosters/filters"],
      });
      qc.invalidateQueries({
        queryKey: ["get", "/orgs/{slug}/events/{id}/rosters/stats"],
      });
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
      const pathSegment = schema.type === "dancer" ? "dancers" : "coaches";
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
    step.name === "done" ? "Upload complete" : `Upload ${schema.label} roster`;

  const uploadBlocked =
    step.name === "preview" &&
    (() => {
      const { acceptedRows } = previewRowCounts(
        step.parse,
        step.serverPreview,
        step.serverPreviewPending,
      );
      const sp = step.serverPreview;
      const pending = step.serverPreviewPending;
      const previewFailed = !sp && !pending;
      return (
        acceptedRows === 0 ||
        step.parse.duplicates.length > 0 ||
        pending ||
        previewFailed ||
        (sp !== null && sp.willError > 0)
      );
    })();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="max-h-[min(720px,100%)] max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {step.name === "preview" || step.name === "error" ? (
            <DialogDescription className="type-meta text-fg-3 truncate">
              {step.file.name} · {step.parse.totalRows.toLocaleString()} rows
              detected · {formatBytes(step.fileSize)}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <DialogBody className="min-h-0 flex-1">
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
          {step.name === "error" && <ErrorView step={step} />}
          {step.name === "uploading" && <UploadingView />}
          {step.name === "done" && <ResultView result={step.result} />}
        </DialogBody>

        <DialogFooter>
          {step.name === "idle" && (
            <Button
              variant="ghost"
              size="lg"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          )}
          {step.name === "preview" && (
            <>
              <Button variant="ghost" size="lg" onClick={reset}>
                Choose different file
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="disabled:border-surface-pressed disabled:bg-surface-pressed disabled:text-fg-2 disabled:opacity-100"
                onClick={() => {
                  setStep({ name: "uploading" });
                  upload.mutate({
                    file: step.file,
                    previewToken: step.serverPreview?.previewToken,
                  });
                }}
                disabled={uploadBlocked}
              >
                {(() => {
                  const dup = step.parse.duplicates.length;
                  if (dup > 0) {
                    return `Fix ${dup} duplicate${dup === 1 ? "" : "s"} to continue`;
                  }
                  const sp = step.serverPreview;
                  const pending = step.serverPreviewPending;
                  if (pending) {
                    return "Checking…";
                  }
                  if (!sp && !pending) {
                    return "Preview failed — try again";
                  }
                  if (sp && sp.willError > 0) {
                    return `Fix ${sp.willError} error${sp.willError === 1 ? "" : "s"} to continue`;
                  }
                  const { acceptedRows } = previewRowCounts(
                    step.parse,
                    sp,
                    pending,
                  );
                  if (sp && sp.willInvite > 0) {
                    return `Upload & send ${sp.willInvite.toLocaleString()} invites`;
                  }
                  return `Upload ${acceptedRows.toLocaleString()} rows`;
                })()}
              </Button>
            </>
          )}
          {step.name === "error" && (
            <Button variant="primary" size="lg" onClick={reset}>
              Choose different file
            </Button>
          )}
          {step.name === "uploading" && (
            <Button size="lg" disabled>
              <BusyLabel label="Uploading…" />
            </Button>
          )}
          {step.name === "done" && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleOpenChange(false)}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

/** A mono heading over a block of the dialog ("Preview", "Rejected rows"). */
function BlockLabel({ children }: { children: React.ReactNode }) {
  return <span className="type-meta text-fg-3">{children}</span>;
}

const tableHead =
  "type-meta text-fg-3 bg-surface-head sticky top-0 h-8 px-(--space-10) text-left font-normal";
const tableCell = "h-8 px-(--space-10)";

function PreviewView({
  step,
  schema,
}: {
  step: Extract<DialogStep, { name: "preview" }>;
  schema: CsvSchema;
}) {
  const columns = step.parse.detectedColumns;

  const hasDuplicates = step.parse.duplicates.length > 0;
  const sp = step.serverPreview;
  const pending = step.serverPreviewPending;
  const hasServerIssues = Boolean(sp && !pending && sp.willError > 0);
  const showImpactCards = !hasDuplicates && !hasServerIssues;

  const serverErrorsByRow = (() => {
    const map = new Map<number, string[]>();
    if (!sp?.errors || pending) return map;
    for (const e of sp.errors) {
      const list = map.get(e.row) ?? [];
      list.push(formatErrorReason(e.reason));
      map.set(e.row, list);
    }
    return map;
  })();

  const previewRows = step.parse.rows.map((row) => {
    const serverErrors = serverErrorsByRow.get(row.index) ?? [];
    return { ...row, serverErrors };
  });

  const { totalRows: rowTotal } = previewRowCounts(step.parse, sp, pending);

  const updateRowsSet = new Set(sp?.updateRows ?? []);
  const willAdd = sp ? sp.willMatch + sp.willInvite : 0;

  return (
    <div className="flex min-h-0 flex-col gap-(--space-12)">
      {showImpactCards && <ImpactSummary pending={pending} preview={sp} />}

      {sp && !pending ? (
        <div className="type-meta flex flex-wrap items-center gap-x-(--space-12) gap-y-(--space-4)">
          <span className="text-fg-3">Preview</span>
          {willAdd > 0 && (
            <span className="text-live tabular-nums">{willAdd} will add</span>
          )}
          {sp.willUpdate > 0 && (
            <span className="text-fg-2 tabular-nums">
              {sp.willUpdate} will update
            </span>
          )}
          {sp.willError > 0 && (
            <span className="text-danger tabular-nums">
              {sp.willError} rejected
            </span>
          )}
        </div>
      ) : (
        <BlockLabel>Preview · {rowTotal.toLocaleString()} rows</BlockLabel>
      )}

      <div className="border-line max-h-[320px] min-h-[120px] overflow-auto rounded-(--radius-8) border">
        <table className="type-body w-full border-collapse">
          <thead>
            <tr>
              <th className={cn(tableHead, "w-10")}>#</th>
              <th className={cn(tableHead, "w-24")}>Status</th>
              {columns.map((col) => (
                <th key={col} className={tableHead}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row) => {
              const combinedErrors = [...row.errors, ...row.serverErrors];
              const hasError = combinedErrors.length > 0;
              return (
                <tr
                  key={row.index}
                  className={cn(
                    "border-line-soft border-t",
                    hasError ? "bg-danger/5" : "hover:bg-surface-hover",
                  )}
                >
                  <td className={cn(tableCell, "type-data text-fg-3 w-10")}>
                    {row.index}
                  </td>
                  <td className={cn(tableCell, "type-meta w-24")}>
                    {hasError ? (
                      <span
                        className="text-danger inline-flex items-center gap-(--space-4)"
                        title={combinedErrors.join("\n")}
                      >
                        <Icon icon={WarningIcon} size="sm" />
                        Rejected
                      </span>
                    ) : pending ? (
                      <span className="text-fg-3">Checking…</span>
                    ) : updateRowsSet.has(row.index) ? (
                      <span className="text-fg-2">Will update</span>
                    ) : (
                      <span className="text-live">Will add</span>
                    )}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col}
                      className={cn(
                        tableCell,
                        "text-fg max-w-[180px] truncate",
                      )}
                      title={row.values[col] ?? ""}
                    >
                      {row.values[col] ?? <span className="text-fg-3">—</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasDuplicates && (
        <p className="type-caption text-fg-2 m-0">
          Upload stays disabled until duplicate values are fixed.
        </p>
      )}

      <ColumnChips
        schema={schema}
        detectedColumns={step.parse.detectedColumns}
        warningsCount={step.parse.warningsCount}
      />
    </div>
  );
}

function ErrorView({ step }: { step: Extract<DialogStep, { name: "error" }> }) {
  return (
    <div
      role="alert"
      className="border-danger/40 flex flex-col gap-(--space-10) rounded-(--radius-8) border p-(--space-14)"
    >
      <div className="flex items-center gap-(--space-8)">
        <Icon icon={XCircleIcon} size="md" className="text-danger" />
        <span className="type-body-strong text-fg">
          This file doesn&rsquo;t look right
        </span>
      </div>
      <ul className="type-body text-fg-2 m-0 flex list-none flex-col gap-(--space-4) p-0">
        {step.parse.missingRequired.map((col) => (
          <li key={col}>
            Missing required column:{" "}
            <code className="type-data text-fg">{col}</code>
          </li>
        ))}
      </ul>
      <p className="type-meta text-fg-3 m-0">
        Detected columns: {step.parse.detectedColumns.join(", ") || "none"}
      </p>
    </div>
  );
}

function UploadingView() {
  return (
    <div className="flex flex-col items-center justify-center gap-(--space-14) py-(--space-32)">
      <Icon icon={FileCsvIcon} size={40} className="text-fg-3 animate-pulse" />
      <div className="bg-track relative h-1 w-full max-w-[280px] overflow-hidden rounded-full">
        <div className="bg-fg animate-loading-bar absolute inset-y-0 left-0 w-1/3 rounded-full" />
      </div>
      <p className="type-body text-fg-2 m-0">Uploading to server…</p>
    </div>
  );
}

function ResultView({ result }: { result: UploadResult }) {
  const added = result?.rowsAdded ?? 0;
  const updated = result?.rowsUpdated ?? 0;
  const errored = result?.rowsErrored ?? 0;
  const activated = result?.rowsActivated ?? 0;
  const pending = result?.rowsPending ?? 0;
  const errors = result?.errors ?? [];
  const hasBreakdown =
    result?.rowsActivated !== undefined && result?.rowsPending !== undefined;

  const summary = buildResultSummary(added, updated, errored);

  return (
    <div className="flex min-h-0 flex-col gap-(--space-12)">
      <div className="flex flex-col gap-(--space-4)">
        <h3 className="type-body-strong text-fg m-0">Roster processed</h3>
        <p className="type-body text-fg-2 m-0">{summary}</p>
      </div>

      <div
        className={cn(
          "grid gap-(--space-8)",
          hasBreakdown ? "sm:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        {hasBreakdown ? (
          <>
            <ImpactCard
              icon={UserCheckIcon}
              value={activated}
              label="activated"
              hint={activated > 0 ? "matched existing accounts" : "none"}
              tone={activated > 0 ? "success" : "muted"}
            />
            <ImpactCard
              icon={EnvelopeSimpleIcon}
              value={pending}
              label="invited"
              hint={pending > 0 ? "pending signup" : "none sent"}
              tone={pending > 0 ? "warn" : "muted"}
            />
            <ImpactCard
              icon={ArrowsClockwiseIcon}
              value={updated}
              label="updated"
              hint={updated > 0 ? "refreshed in place" : "none"}
              tone="muted"
            />
          </>
        ) : (
          <>
            <ImpactCard
              icon={UserCheckIcon}
              value={added}
              label={added === 1 ? "row added" : "rows added"}
              hint={added > 0 ? "added to roster" : "none"}
              tone={added > 0 ? "success" : "muted"}
            />
            <ImpactCard
              icon={ArrowsClockwiseIcon}
              value={updated}
              label={updated === 1 ? "row updated" : "rows updated"}
              hint={updated > 0 ? "refreshed in place" : "none"}
              tone="muted"
            />
          </>
        )}
      </div>

      {errored > 0 && (
        <div className="border-danger/40 flex items-center gap-(--space-8) rounded-(--radius-8) border px-(--space-12) py-(--space-10)">
          <Icon icon={WarningIcon} className="text-danger shrink-0" />
          <span className="type-body-strong text-danger tabular-nums">
            {errored.toLocaleString()} row{errored === 1 ? "" : "s"} rejected
          </span>
          {errors.length > 0 && (
            <span className="type-meta text-fg-3">see reasons below</span>
          )}
        </div>
      )}

      {errors.length > 0 && (
        <div className="flex min-h-0 flex-col gap-(--space-8)">
          <BlockLabel>Rejected rows</BlockLabel>
          <div className="border-line max-h-[240px] overflow-auto rounded-(--radius-8) border">
            <table className="type-body w-full border-collapse">
              <thead>
                <tr>
                  <th className={cn(tableHead, "w-12")}>#</th>
                  <th className={tableHead}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err, i) => (
                  <tr key={i} className="border-line-soft border-t">
                    <td className={cn(tableCell, "type-data text-fg-3 w-12")}>
                      {err.row}
                    </td>
                    <td className={cn(tableCell, "text-fg")}>
                      {formatErrorReason(err.reason)}
                    </td>
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

function buildResultSummary(
  added: number,
  updated: number,
  errored: number,
): string {
  const parts: string[] = [];
  if (added > 0) parts.push(`${added.toLocaleString()} added`);
  if (updated > 0) parts.push(`${updated.toLocaleString()} updated`);
  if (errored > 0) parts.push(`${errored.toLocaleString()} rejected`);
  if (parts.length === 0) return "No rows processed";
  return parts.join(" · ");
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
    <ol className="type-meta bp-phone:gap-(--space-6) m-0 flex list-none flex-wrap items-center gap-(--space-8) p-0">
      {steps.map((s, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        return (
          <li
            key={s.id}
            aria-current={isActive ? "step" : undefined}
            className="flex items-center gap-(--space-8)"
          >
            <span
              className={cn(
                "flex items-center gap-(--space-6)",
                isActive ? "text-fg" : isDone ? "text-fg-2" : "text-fg-3",
              )}
            >
              <span
                className={cn(
                  "grid size-[18px] place-items-center rounded-full border tabular-nums",
                  isActive
                    ? "border-fg bg-fg text-on-fg"
                    : isDone
                      ? "border-line-control text-fg-2"
                      : "border-line-control text-fg-3",
                )}
              >
                {isDone ? <Icon icon={CheckIcon} size="sm" /> : i + 1}
              </span>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className="bg-line bp-phone:w-2 h-px w-6"
              />
            )}
          </li>
        );
      })}
    </ol>
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
    <div className="flex flex-col gap-(--space-16)">
      {/* The S2S DropZone look; it keeps this dialog's own drop and picker
          handlers so any dropped file is parsed as before. */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onPickClick}
        className={cn(
          "border-line-dashed flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-(--space-10) rounded-(--radius-8) border border-dashed p-(--space-16) text-center",
          "hover:border-line-hover transition-[border-color,background-color] duration-150 ease-[ease]",
          isDragging && "border-line-hover bg-surface-hover",
        )}
      >
        <Icon icon={CloudArrowUpIcon} size="lg" className="text-fg-2" />
        <span className="type-body text-fg-2 flex flex-wrap items-center justify-center gap-(--space-8)">
          {isDragging ? "Release to upload" : "Drop a CSV file, or"}
          {!isDragging && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onPickClick();
              }}
            >
              Browse
            </Button>
          )}
        </span>
        <span className="text-fg-3 font-mono text-[11px] leading-[1.4]">
          Up to 500 rows
        </span>
      </div>

      <ExpectedColumns schema={schema} />
    </div>
  );
}

function ExpectedColumns({ schema }: { schema: CsvSchema }) {
  return (
    <div className="flex flex-col gap-(--space-8)">
      <BlockLabel>Expected columns</BlockLabel>
      <div className="flex flex-wrap gap-(--space-6)">
        {schema.columns.map((col) => (
          <Tag
            key={col.key}
            tone={col.required ? "default" : "muted"}
            className={col.required ? undefined : "border-dashed"}
          >
            {col.key}
            {!col.required && <span className="text-fg-3">optional</span>}
          </Tag>
        ))}
      </div>
    </div>
  );
}

function ImpactSummary({
  pending,
  preview,
}: {
  pending: boolean;
  preview: ServerPreview | null;
}) {
  if (pending) {
    return (
      <div
        aria-busy="true"
        className="border-line flex items-center gap-(--space-12) rounded-(--radius-8) border p-(--space-12)"
      >
        <div className="bg-surface-pressed size-8 animate-pulse rounded-(--radius-6)" />
        <div className="flex-1 space-y-(--space-6)">
          <div className="bg-surface-pressed h-3 w-32 animate-pulse rounded" />
          <div className="bg-surface-hover h-2 w-48 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  const hasMatches = preview.willMatch > 0;
  const hasInvites = preview.willInvite > 0;
  const hasUpdates = preview.willUpdate > 0;

  return (
    <div className="grid gap-(--space-8) sm:grid-cols-3">
      <ImpactCard
        icon={UserCheckIcon}
        value={preview.willMatch}
        label={preview.willMatch === 1 ? "new match" : "new matches"}
        hint={hasMatches ? "will activate on upload" : "none"}
        tone={hasMatches ? "success" : "muted"}
      />
      <ImpactCard
        icon={EnvelopeSimpleIcon}
        value={preview.willInvite}
        label={preview.willInvite === 1 ? "invite" : "invites"}
        hint={hasInvites ? "will send on upload" : "none needed"}
        tone={hasInvites ? "warn" : "muted"}
      />
      <ImpactCard
        icon={ArrowsClockwiseIcon}
        value={preview.willUpdate}
        label={preview.willUpdate === 1 ? "update" : "updates"}
        hint={hasUpdates ? "already on roster" : "none"}
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
  icon: PhosphorIcon;
  value: number;
  label: string;
  hint: string;
  tone: "success" | "warn" | "muted" | "error";
}) {
  return (
    <div className="border-line flex items-center gap-(--space-10) rounded-(--radius-8) border p-(--space-12)">
      <span
        className={cn(
          "bg-surface-chip grid size-8 shrink-0 place-items-center rounded-(--radius-6)",
          tone === "success" && "text-live",
          tone === "warn" && "text-amber",
          tone === "muted" && "text-fg-3",
          tone === "error" && "text-danger",
        )}
      >
        <Icon icon={icon} />
      </span>
      <div className="flex min-w-0 flex-col gap-(--space-2)">
        <span className="type-body text-fg-2">
          <span className="type-data text-fg">{value.toLocaleString()}</span>{" "}
          {label}
        </span>
        <span className="type-meta text-fg-3 truncate">{hint}</span>
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
    <div className="flex flex-wrap items-center gap-(--space-6)">
      {schema.columns.map((col) => {
        const isMatched = detectedColumns.includes(col.key);
        return (
          <Tag
            key={col.key}
            tone={isMatched ? "default" : "muted"}
            aria-label={`${col.key}: ${isMatched ? "found" : "not in file"}`}
          >
            {isMatched && <Icon icon={CheckIcon} className="text-live" />}
            {col.key}
          </Tag>
        );
      })}
      {warningsCount > 0 && (
        <Tag className="text-amber ms-auto">
          <Icon icon={WarningIcon} />
          {warningsCount} skipped
        </Tag>
      )}
    </div>
  );
}
