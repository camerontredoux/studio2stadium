import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRightIcon,
  CheckIcon,
  CircleXIcon,
  CloudUploadIcon,
  ExpandIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import {
  adminQueries,
  type ChecklistItem,
  type CsvUploadSummary,
  type OrgEvent,
} from "@/features/org/api/admin-queries";
import {
  DashboardHeader,
  SidebarDetailsSection,
  SidebarPhaseSection,
  SidebarSection,
  StatCell,
  formatDateRange,
  scheduleFileUrl,
} from "@/features/org/components/dashboard-shared";
import {
  CreateEventForm,
  EventFormSheet,
} from "@/features/org/components/event-form-sheet";
import { RosterUploadRow } from "@/features/org/components/roster-upload-row";
import {
  useAdminCommandListener,
  useAdminCommands,
} from "@/features/org/hooks/use-admin-commands";
import {
  useEventPhase,
  type EventPhaseInfo,
} from "@/features/org/hooks/use-event-phase";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Progress } from "@/components/ui/progress";
import { useRequestUpload } from "@/shared/images/api/mutations";
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";
import { client } from "@/lib/api/client";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/admin/")({
  component: AdminHome,
});

function AdminDashboard({
  orgSlug,
  activeEvent,
}: {
  orgSlug: string;
  activeEvent: OrgEvent;
}) {
  const { data: stats } = useSuspenseQuery(
    adminQueries.stats(orgSlug, activeEvent.id),
  );
  const [editOpen, setEditOpen] = useState(false);
  useAdminCommands();

  useAdminCommandListener(
    (a) => a.type === "open-edit-event",
    () => setEditOpen(true),
  );

  const totalRoster = stats.coaches.total + stats.dancers.total;
  const activationPct =
    totalRoster === 0 ? 0 : Math.round((stats.registered / totalRoster) * 100);

  const phase = useEventPhase(activeEvent.startDate, activeEvent.endDate);
  const dateRange = formatDateRange(activeEvent.startDate, activeEvent.endDate);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto xl:flex-row xl:overflow-hidden">
      <div className="flex min-w-0 flex-col xl:min-h-0 xl:flex-1 xl:overflow-hidden">
        <DashboardHeader
          name={activeEvent.name}
          phase={phase}
          dateRange={dateRange}
          actions={
            <div className="flex items-center gap-3">
              <div className="text-sm 2xl:text-base">
                <span className="font-semibold tabular-nums">
                  {stats.registered}
                </span>
                <span className="text-muted-foreground">
                  /{totalRoster} activated
                </span>
              </div>
              <div
                className="bg-border h-0.5 w-[120px] overflow-hidden"
                role="progressbar"
                aria-valuenow={activationPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Roster activation progress"
              >
                <div
                  className="bg-foreground h-full"
                  style={{ width: `${activationPct}%` }}
                />
              </div>
              <span className="text-muted-foreground text-[11px] tabular-nums 2xl:text-xs">
                {activationPct}%
              </span>
            </div>
          }
        />

        <section
          aria-label="Event stats"
          className="border-border flex items-stretch border-y"
        >
          <SplitStatCell
            label="Dancers"
            activated={stats.dancers.activated}
            pending={stats.dancers.pending}
            total={stats.dancers.total}
          />
          <SplitStatCell
            label="Coaches"
            activated={stats.coaches.activated}
            pending={stats.coaches.pending}
            total={stats.coaches.total}
          />
          <StatCell label="Pending" value={stats.pending} />
          <StatCell label="Activated" value={stats.registered} />
        </section>

        <section
          aria-label="Event panels"
          className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-4 lg:grid-cols-2 lg:grid-rows-2"
        >
          <div className="flex min-h-0 flex-col overflow-hidden">
            <RosterUploadRow
              orgSlug={orgSlug}
              eventId={activeEvent.id}
              type="dancer"
              lastUpload={
                stats.recentUploads.find((u) => u.type === "dancer") ?? null
              }
            />
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden">
            <RosterUploadRow
              orgSlug={orgSlug}
              eventId={activeEvent.id}
              type="coach"
              lastUpload={
                stats.recentUploads.find((u) => u.type === "coach") ?? null
              }
            />
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden">
            <PreEventChecklist
              orgSlug={orgSlug}
              eventId={activeEvent.id}
              phase={phase}
            />
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden">
            <ScheduleUploadPanel
              orgSlug={orgSlug}
              eventId={activeEvent.id}
              scheduleKey={activeEvent.schedulePdfUrl}
            />
          </div>
        </section>
      </div>

      <EventSidebar
        orgSlug={orgSlug}
        activeEvent={activeEvent}
        phase={phase}
        stats={stats.recentUploads}
      />

      <EventFormSheet
        orgSlug={orgSlug}
        event={activeEvent}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}


function SplitStatCell({
  label,
  activated,
  pending,
  total,
}: {
  label: string;
  activated: number;
  pending: number;
  total: number;
}) {
  return (
    <div className="border-border flex flex-1 flex-col justify-center gap-1 border-l px-4 py-3 first:border-l-0">
      <span className="text-2xl leading-none font-semibold tracking-tight tabular-nums 2xl:text-3xl">
        {total.toLocaleString()}
      </span>
      <span className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase 2xl:text-xs">
        {label}
      </span>
      <span className="text-muted-foreground text-[10px] tabular-nums">
        {activated} activated · {pending} pending
      </span>
    </div>
  );
}

/* ---------- Pre-event checklist ---------- */

function PreEventChecklist({
  orgSlug,
  eventId,
  phase,
}: {
  orgSlug: string;
  eventId: string;
  phase: EventPhaseInfo;
}) {
  const qc = useQueryClient();
  const queryKey = adminQueries.checklist(orgSlug, eventId).queryKey;
  const { data: items } = useSuspenseQuery(
    adminQueries.checklist(orgSlug, eventId),
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDraftTitle, setEditDraftTitle] = useState("");
  const [deleteItem, setDeleteItem] = useState<ChecklistItem | undefined>();
  const [inlineCreateOpen, setInlineCreateOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  const done = items.filter((i) => i.completed).length;
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const urgency =
    phase.phase === "upcoming" && phase.daysUntilStart > 14
      ? "relaxed"
      : phase.phase === "upcoming"
        ? "tight"
        : phase.phase === "imminent"
          ? "critical"
          : "done";

  const rawClient = client as unknown as {
    POST: (
      path: string,
      opts: { body: unknown },
    ) => Promise<{ data: ChecklistItem }>;
    PATCH: (
      path: string,
      opts: { body: Record<string, unknown> },
    ) => Promise<{ data: ChecklistItem }>;
    DELETE: (
      path: string,
      opts?: Record<string, unknown>,
    ) => Promise<{ data: unknown }>;
  };

  const toggleMutation = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const res = await rawClient.PATCH(
        `/orgs/${orgSlug}/events/${eventId}/checklist/${item.id}`,
        { body: { completed: !item.completed } },
      );
      return res.data;
    },
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ChecklistItem[]>(queryKey);
      qc.setQueryData<ChecklistItem[]>(queryKey, (old) =>
        old?.map((i) =>
          i.id === item.id ? { ...i, completed: !i.completed } : i,
        ),
      );
      return { prev };
    },
    onError: (_err, _item, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: { title: string }) => {
      const res = await rawClient.POST(
        `/orgs/${orgSlug}/events/${eventId}/checklist`,
        { body },
      );
      return res.data;
    },
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ChecklistItem[]>(queryKey);
      const optimistic: ChecklistItem = {
        id: `optimistic-${Date.now()}`,
        eventId,
        title: body.title,
        description: null,
        completed: false,
        position: prev?.length ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      qc.setQueryData<ChecklistItem[]>(queryKey, (old) => [
        ...(old ?? []),
        optimistic,
      ]);
      setDraftTitle("");
      setInlineCreateOpen(false);
      return { prev };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toastManager.add({ title: "Couldn't add item", type: "error" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await rawClient.DELETE(
        `/orgs/${orgSlug}/events/${eventId}/checklist/${itemId}`,
        {},
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
    onError: () => {
      toastManager.add({ title: "Couldn't delete item", type: "error" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      itemId,
      title,
    }: {
      itemId: string;
      title: string;
    }) => {
      const res = await rawClient.PATCH(
        `/orgs/${orgSlug}/events/${eventId}/checklist/${itemId}`,
        { body: { title } },
      );
      return res.data;
    },
    onMutate: async ({ itemId, title }) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ChecklistItem[]>(queryKey);
      qc.setQueryData<ChecklistItem[]>(
        queryKey,
        (old) => old?.map((i) => (i.id === itemId ? { ...i, title } : i)) ?? [],
      );
      setEditingItemId(null);
      setEditDraftTitle("");
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toastManager.add({ title: "Couldn't update item", type: "error" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  const cancelInlineCreate = () => {
    setInlineCreateOpen(false);
    setDraftTitle("");
  };

  const submitInlineCreate = () => {
    const trimmedTitle = draftTitle.trim();
    if (!trimmedTitle || createMutation.isPending) return;
    createMutation.mutate({
      title: trimmedTitle,
    });
  };

  const startInlineEdit = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditDraftTitle(item.title);
  };

  const cancelInlineEdit = () => {
    setEditingItemId(null);
    setEditDraftTitle("");
  };

  const submitInlineEdit = (itemId: string) => {
    const trimmedTitle = editDraftTitle.trim();
    if (!trimmedTitle || updateMutation.isPending) return;
    updateMutation.mutate({ itemId, title: trimmedTitle });
  };

  return (
    <div className="border-border flex h-full min-h-0 w-full flex-col rounded-md border">
      <div className="border-border bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
            Pre-event checklist
          </span>
          <span className="text-muted-foreground text-[11px] 2xl:text-xs">
            {done}/{total} complete ·{" "}
            <UrgencyLabel urgency={urgency} days={phase.daysUntilStart} />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[11px] tabular-nums 2xl:text-xs">
            {pct}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-5"
            onClick={() => {
              setInlineCreateOpen(true);
            }}
            aria-label="Add checklist item"
            disabled={createMutation.isPending}
          >
            <PlusIcon className="size-3" />
          </Button>
        </div>
      </div>

      {inlineCreateOpen && (
        <div className="border-border bg-muted/25 flex items-center gap-3 border-b px-3 py-2">
          <input
            type="text"
            autoFocus
            value={draftTitle}
            placeholder="Add checklist item..."
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitInlineCreate();
              }
              if (e.key === "Escape") {
                cancelInlineCreate();
              }
            }}
            className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-xs font-medium outline-none 2xl:text-sm"
          />
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground shrink-0 p-1 transition-colors disabled:pointer-events-none disabled:opacity-50"
              disabled={!draftTitle.trim() || createMutation.isPending}
              onClick={submitInlineCreate}
              aria-label="Add item"
            >
              <CheckIcon className="size-3" />
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground shrink-0 p-1 transition-colors disabled:pointer-events-none disabled:opacity-50"
              onClick={cancelInlineCreate}
              disabled={createMutation.isPending}
              aria-label="Cancel adding item"
            >
              <CircleXIcon className="size-3" />
            </button>
          </div>
        </div>
      )}

      <ul className="divide-border max-h-46 min-h-0 divide-y overflow-y-auto">
        {items.map((item) => {
          const isEditing = editingItemId === item.id;
          if (isEditing) {
            return (
              <li
                key={item.id}
                className="bg-muted/25 flex items-center gap-3 px-3 py-2"
              >
                <input
                  type="text"
                  autoFocus
                  value={editDraftTitle}
                  onChange={(e) => setEditDraftTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitInlineEdit(item.id);
                    }
                    if (e.key === "Escape") {
                      cancelInlineEdit();
                    }
                  }}
                  className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-xs font-medium outline-none 2xl:text-sm"
                />
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground shrink-0 p-1 transition-colors disabled:pointer-events-none disabled:opacity-50"
                  disabled={!editDraftTitle.trim() || updateMutation.isPending}
                  onClick={() => submitInlineEdit(item.id)}
                  aria-label="Save item"
                >
                  <CheckIcon className="size-3" />
                </button>
              </li>
            );
          }

          return (
            <li
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => toggleMutation.mutate(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleMutation.mutate(item);
                }
              }}
              className="hover:bg-muted/40 group flex w-full cursor-pointer items-center gap-3 px-3 py-2 transition-colors"
            >
              <span
                className={cn(
                  "border-border flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                  item.completed
                    ? "bg-foreground border-foreground"
                    : "bg-background",
                )}
                aria-hidden
              >
                {item.completed && (
                  <CheckIcon
                    className="text-background size-3"
                    strokeWidth={3}
                  />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span
                  className={cn(
                    "text-xs font-medium 2xl:text-sm",
                    item.completed && "text-muted-foreground line-through",
                  )}
                >
                  {item.title}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startInlineEdit(item);
                }}
                className="text-muted-foreground hover:text-foreground shrink-0 p-0.5 opacity-0 transition-all group-hover:opacity-100"
                aria-label="Edit item"
              >
                <PencilIcon className="size-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteItem(item);
                }}
                className="text-muted-foreground hover:text-destructive shrink-0 p-0.5 opacity-0 transition-all group-hover:opacity-100"
                aria-label="Delete item"
              >
                <Trash2Icon className="size-3" />
              </button>
            </li>
          );
        })}
      </ul>

      <AlertDialog
        open={deleteItem !== undefined}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete checklist item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteItem?.title}&rdquo;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deleteItem) return;
                deleteMutation.mutate(deleteItem.id, {
                  onSuccess: () => setDeleteItem(undefined),
                });
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UrgencyLabel({
  urgency,
  days,
}: {
  urgency: "relaxed" | "tight" | "critical" | "done";
  days: number;
}) {
  if (urgency === "done") return <span>event underway</span>;
  if (urgency === "critical")
    return (
      <span className="text-warning-foreground">
        {days <= 0 ? "due now" : `${days}d left`}
      </span>
    );
  if (urgency === "tight") return <span>{days}d left</span>;
  return <span>on track</span>;
}

/* ---------- Schedule upload panel ---------- */

function ScheduleUploadPanel({
  orgSlug,
  eventId,
  scheduleKey,
}: {
  orgSlug: string;
  eventId: string;
  scheduleKey: string | null;
}) {
  const qc = useQueryClient();
  const { mutateAsync: requestUpload } = useRequestUpload();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const rawClient = client as unknown as {
    PATCH: (
      path: string,
      opts: { body: Record<string, unknown> },
    ) => Promise<{ data: unknown }>;
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { key, url } = await requestUpload({
        body: { contentType: file.type, type: "schedule" },
      });

      setUploading(true);
      await uploadToCloudflare(url, file, setProgress);

      await rawClient.PATCH(`/orgs/${orgSlug}/events/${eventId}`, {
        body: { schedulePdfUrl: key },
      });

      return key;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgSlug, "events"] });
      setFiles([]);
      setProgress(0);
      setUploading(false);
      toastManager.add({
        title: "Schedule uploaded",
        type: "success",
      });
    },
    onError: () => {
      setUploading(false);
      setProgress(0);
      toastManager.add({
        title: "Failed to upload schedule",
        type: "error",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      await rawClient.PATCH(`/orgs/${orgSlug}/events/${eventId}`, {
        body: { schedulePdfUrl: null },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgs", orgSlug, "events"] });
      toastManager.add({ title: "Schedule removed", type: "success" });
    },
  });

  const isLoading = uploadMutation.isPending || uploading;
  const fileUrl = scheduleKey ? scheduleFileUrl(orgSlug, eventId) : null;
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="border-border flex h-full min-h-0 flex-col rounded-md border">
        <div className="border-border bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
          <div className="flex min-w-0 flex-col">
            <span className="text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
              Event Schedule
            </span>
            <span className="text-muted-foreground text-[11px] 2xl:text-xs">
              PDF or image · visible to attendees
            </span>
          </div>
          {scheduleKey && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                onClick={() => setExpanded(true)}
                aria-label="Expand schedule"
              >
                <ExpandIcon className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                onClick={() => setConfirmRemove(true)}
                disabled={removeMutation.isPending}
                aria-label="Remove schedule"
              >
                <XIcon className="size-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {scheduleKey && fileUrl ? (
            <div className="relative min-h-0 flex-1">
              {scheduleKey.endsWith(".pdf") ? (
                <iframe
                  src={fileUrl}
                  className="h-full w-full"
                  title="Event schedule"
                />
              ) : (
                <img
                  src={fileUrl}
                  alt="Event schedule"
                  className="h-full w-full object-contain"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-4">
              {files.length > 0 ? (
                <div className="flex w-full flex-col gap-3">
                  <FileUpload
                    value={files}
                    onValueChange={setFiles}
                    accept="image/*,.pdf,application/pdf"
                    maxFiles={1}
                    maxSize={25 * 1024 * 1024}
                    onFileReject={(_, message) => {
                      toastManager.add({
                        title: "Error",
                        description: message,
                        type: "error",
                      });
                    }}
                  >
                    <FileUploadList>
                      {files.map((file, i) => (
                        <FileUploadItem
                          key={i}
                          value={file}
                          className="flex-col"
                        >
                          <div className="flex w-full items-center gap-2">
                            <FileUploadItemPreview
                              className="size-10"
                              render={(f, fallback) =>
                                f.type === "application/pdf" ? (
                                  <FileTextIcon className="text-muted-foreground size-5" />
                                ) : (
                                  fallback()
                                )
                              }
                            />
                            <FileUploadItemMetadata size="sm" />
                            <FileUploadItemDelete asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6"
                              >
                                <XIcon className="size-3" />
                              </Button>
                            </FileUploadItemDelete>
                          </div>
                          {isLoading && (
                            <Progress value={progress} className="w-full" />
                          )}
                        </FileUploadItem>
                      ))}
                    </FileUploadList>
                  </FileUpload>
                  <Button
                    size="sm"
                    disabled={isLoading}
                    onClick={() => {
                      if (files[0]) uploadMutation.mutate(files[0]);
                    }}
                  >
                    {isLoading ? "Uploading..." : "Upload schedule"}
                  </Button>
                </div>
              ) : (
                <FileUpload
                  value={files}
                  onValueChange={setFiles}
                  accept="image/*,.pdf,application/pdf"
                  maxFiles={1}
                  maxSize={25 * 1024 * 1024}
                  onFileReject={(_, message) => {
                    toastManager.add({
                      title: "Error",
                      description: message,
                      type: "error",
                    });
                  }}
                  className="w-full"
                >
                  <FileUploadDropzone className="flex-col gap-2 border-dashed py-6 text-center">
                    <CloudUploadIcon className="text-muted-foreground size-6" />
                    <div className="text-muted-foreground text-xs">
                      Drag and drop or{" "}
                      <FileUploadTrigger asChild>
                        <Button variant="secondary" size="xs">
                          Browse
                        </Button>
                      </FileUploadTrigger>
                    </div>
                    <span className="text-muted-foreground/60 text-[10px]">
                      PDF or image, up to 25MB
                    </span>
                  </FileUploadDropzone>
                </FileUpload>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={confirmRemove}
        onOpenChange={(open) => {
          if (!open) setConfirmRemove(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the event schedule? You can upload a
              new one at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={() => {
                removeMutation.mutate(undefined, {
                  onSuccess: () => setConfirmRemove(false),
                });
              }}
            >
              Remove
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {fileUrl && (
        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent
            className="max-w-5xl"
            bottomStickOnMobile={false}
          >
            <DialogHeader>
              <DialogTitle>Event Schedule</DialogTitle>
            </DialogHeader>
            <div className="h-[80vh] w-full px-6 pb-6">
              {scheduleKey?.endsWith(".pdf") ? (
                <iframe
                  src={fileUrl}
                  className="h-full w-full rounded-md border"
                  title="Event schedule"
                />
              ) : (
                <img
                  src={fileUrl}
                  alt="Event schedule"
                  className="h-full w-full rounded-md object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/* ---------- Right sidebar ---------- */

function EventSidebar({
  orgSlug,
  activeEvent,
  phase,
  stats,
}: {
  orgSlug: string;
  activeEvent: OrgEvent;
  phase: EventPhaseInfo;
  stats: CsvUploadSummary[];
}) {
  return (
    <aside className="border-border flex w-full shrink-0 flex-col border-t xl:w-[320px] xl:overflow-x-hidden xl:overflow-y-auto xl:border-t-0 xl:border-l">
      <SidebarPhaseSection phase={phase} />
      <SidebarDetailsSection orgSlug={orgSlug} event={activeEvent} />
      <SidebarActivitySection orgSlug={orgSlug} uploads={stats} />
    </aside>
  );
}

function SidebarActivitySection({
  orgSlug,
  uploads,
}: {
  orgSlug: string;
  uploads: CsvUploadSummary[];
}) {
  const recent = uploads.slice(0, 4);
  if (recent.length === 0) {
    return (
      <SidebarSection title="Recent activity">
        <p className="text-muted-foreground text-xs 2xl:text-sm">
          No uploads yet.
        </p>
      </SidebarSection>
    );
  }
  return (
    <SidebarSection title="Recent activity">
      <ul className="flex flex-col gap-2">
        {recent.map((upload) => {
          const touched = (upload.rowsAdded ?? 0) + (upload.rowsUpdated ?? 0);
          return (
            <li
              key={upload.id}
              className="flex items-start gap-2 text-xs 2xl:text-sm"
            >
              <UploadIcon className="text-muted-foreground mt-0.5 size-3 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span>
                  <span className="font-medium tabular-nums">
                    {touched.toLocaleString()}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {upload.type === "dancer" ? "dancers" : "coaches"} uploaded
                  </span>
                </span>
                <span className="text-muted-foreground text-[10px] 2xl:text-xs">
                  {formatDistanceToNow(new Date(upload.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <Link
        to="/$orgSlug/admin/uploads"
        params={{ orgSlug }}
        className="text-foreground hover:text-brand mt-3 inline-flex items-center gap-1 text-[11px] font-medium 2xl:text-xs"
      >
        View all uploads
        <ArrowRightIcon className="size-3" />
      </Link>
    </SidebarSection>
  );
}

function AdminHome() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const activeEvent = events?.find((e) => e.isActive);

  if (!activeEvent) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-semibold">Create your first event</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            You'll be able to upload rosters once an event is active.
          </p>
        </div>
        <CreateEventForm orgSlug={orgSlug} />
      </div>
    );
  }

  return (
    <AdminDashboard
      orgSlug={orgSlug}
      activeEvent={activeEvent}
    />
  );
}
