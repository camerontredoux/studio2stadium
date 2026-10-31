import {
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  DownloadSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  type ComponentType,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { DropZone } from "@/components/event/drop-zone";
import { Icon } from "@/components/event/icon";
import { ProgressBar } from "@/components/event/progress-bar";
import { Widget } from "@/components/event/shell";
import { useWidgetBoardSlot } from "@/components/event/shell/widget-board-context";
import { toastManager } from "@/components/ui/toast-manager";
import {
  invalidateOrgEvents,
  type OrgEvent,
} from "@/features/org/api/admin-queries";
import { scheduleFileUrl } from "@/features/org/components/dashboard-shared";
import { useOrg } from "@/features/org/context/use-org";
import { BusyLabel } from "@/features/org/live/shared/busy-label";
import type { SchedulePdfPagesProps } from "@/features/org/live/shared/schedule-pdf-pages";
import { client } from "@/lib/api/client";
import { useRequestUpload } from "@/shared/images/api/mutations";
import { uploadToCloudflare } from "@/utils/upload-to-cloudflare";

type ScheduleWidgetProps = {
  event: OrgEvent;
  /** Admins upload, replace and remove the schedule; viewers download it. */
  mode: "admin" | "viewer";
  /** Must be in the surrounding `WidgetBoard`'s `order`. Default "schedule". */
  id?: string;
};

const MAX_SIZE = 25 * 1024 * 1024;
const ACCEPT = "image/*,.pdf,application/pdf";

// The stored key ends in the uploaded file's extension (".pdf", ".png", …).
function scheduleFileName(key: string) {
  const ext = /\.[a-z0-9]+$/i.exec(key)?.[0] ?? "";
  return `schedule${ext.toLowerCase()}`;
}

// Widths of the faded placeholder lines on the peek's blurred page.
const SHEET_GROUPS = [
  { head: "w-[55%] h-2.5", rows: ["w-[52%]", "w-[64%]", "w-[40%]", "w-[58%]"] },
  {
    head: "w-[35%] h-2 mt-1.5",
    rows: ["w-[46%]", "w-[70%]", "w-[38%]", "w-[60%]", "w-[50%]"],
  },
  { head: "w-[42%] h-2 mt-1.5", rows: ["w-[56%]", "w-[44%]", "w-[66%]"] },
];

function ScheduleSheet() {
  return (
    <span className="s2s-doc-sheet">
      {SHEET_GROUPS.map((group) => (
        <span key={group.head} className="contents">
          <span className={`s2s-doc-line ${group.head}`} />
          {group.rows.map((row) => (
            <span key={row} className="s2s-doc-row">
              <span className="w-[18%]" />
              <span className={row} />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

// pdf.js is large, so it loads only when the widget shows a schedule PDF.
// If the chunk fails to load (a deploy replaced it, a flaky network), show
// the download fallback instead of the error boundary.
const SchedulePdfPages = lazy<ComponentType<SchedulePdfPagesProps>>(() =>
  import("@/features/org/live/shared/schedule-pdf-pages").catch(() => ({
    default: PdfPagesUnavailable,
  })),
);

const SchedulePdfFirstPage = lazy<
  ComponentType<SchedulePdfPagesProps & { className?: string }>
>(() =>
  import("@/features/org/live/shared/schedule-pdf-pages").then(
    (m) => ({ default: m.SchedulePdfFirstPage }),
    () => ({ default: PdfPagesUnavailable }),
  ),
);

function PdfPagesUnavailable({ onError }: SchedulePdfPagesProps) {
  useEffect(() => onError(), [onError]);
  return null;
}

/**
 * Fetches the schedule PDF straight from storage with a signed URL, so the
 * bytes never pass through the API. If storage refuses the read (its CORS
 * rule doesn't allow this origin) or the URL fails, it falls back to the
 * API's copy, which the browser may cache by the schedule's key.
 */
async function fetchSchedulePdf(
  orgSlug: string,
  eventId: string,
  scheduleKey: string,
  signal: AbortSignal,
): Promise<Uint8Array> {
  try {
    const { data } = await client.GET("/orgs/{slug}/events/{id}/schedule/url", {
      params: { path: { slug: orgSlug, id: eventId } },
      signal,
    });
    if (data) {
      const res = await fetch(data.url, { credentials: "omit", signal });
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
    }
  } catch (err) {
    if (signal.aborted) throw err;
  }

  const fallback = `${scheduleFileUrl(orgSlug, eventId)}/file?v=${encodeURIComponent(scheduleKey)}`;
  const res = await fetch(fallback, { credentials: "include", signal });
  if (!res.ok) throw new Error(`Schedule fetch failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

/**
 * The schedule PDF's bytes, fetched once and shared by the peek and the open
 * view. pdf.js takes ownership of the buffer it is given, so each caller gets
 * its own copy.
 */
async function loadSchedulePdf(
  qc: QueryClient,
  orgSlug: string,
  eventId: string,
  scheduleKey: string,
): Promise<Uint8Array> {
  const bytes = await qc.fetchQuery({
    queryKey: ["org-schedule-pdf", orgSlug, eventId, scheduleKey],
    queryFn: ({ signal }) =>
      fetchSchedulePdf(orgSlug, eventId, scheduleKey, signal),
    staleTime: Infinity,
  });
  return bytes.slice();
}

/**
 * The collapsed widget's background: the schedule's first page, dimmed and
 * blurred behind the label. The placeholder sheet shows until the page is
 * drawn, and stays if the file isn't a PDF or can't be drawn.
 */
function SchedulePeekBackground({
  orgSlug,
  eventId,
  scheduleKey,
}: {
  orgSlug: string;
  eventId: string;
  scheduleKey: string;
}) {
  const qc = useQueryClient();
  const [drawn, setDrawn] = useState(false);
  const [failed, setFailed] = useState(false);
  const isPdf = scheduleKey.toLowerCase().endsWith(".pdf");

  const loadPdf = useCallback(
    () => loadSchedulePdf(qc, orgSlug, eventId, scheduleKey),
    [qc, orgSlug, eventId, scheduleKey],
  );

  return (
    <span className="s2s-doc-bg" aria-hidden="true">
      {!drawn && <ScheduleSheet />}
      {isPdf && !failed && (
        <Suspense fallback={null}>
          <SchedulePdfFirstPage
            load={loadPdf}
            onReady={() => setDrawn(true)}
            onError={() => setFailed(true)}
            className="s2s-doc-page"
          />
        </Suspense>
      )}
    </span>
  );
}

function SchedulePreview({
  orgSlug,
  eventId,
  scheduleKey,
  fileUrl,
  mounted,
}: {
  orgSlug: string;
  eventId: string;
  scheduleKey: string;
  fileUrl: string;
  /** False until the widget first settles open; the file loads from then on. */
  mounted: boolean;
}) {
  const qc = useQueryClient();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const isPdf = scheduleKey.toLowerCase().endsWith(".pdf");

  const loadPdf = useCallback(
    () => loadSchedulePdf(qc, orgSlug, eventId, scheduleKey),
    [qc, orgSlug, eventId, scheduleKey],
  );

  return (
    <div className="bg-bg-150 relative h-full min-h-[320px]">
      {(!mounted || !loaded) && (
        <div className="type-body text-fg-2 absolute inset-0 flex items-center justify-center gap-(--space-8)">
          <BusyLabel label="Loading schedule…" />
        </div>
      )}
      {!mounted ? null : failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-(--space-10) p-(--space-16) text-center">
          <p className="type-body text-fg-2 m-0">
            The schedule couldn&apos;t be shown here.
          </p>
          <Button
            size="sm"
            render={<a href={fileUrl} target="_blank" rel="noreferrer" />}
          >
            <Icon icon={DownloadSimpleIcon} />
            Open the schedule
          </Button>
        </div>
      ) : isPdf ? (
        <Suspense fallback={null}>
          <SchedulePdfPages
            load={loadPdf}
            onReady={() => setLoaded(true)}
            onError={() => {
              setFailed(true);
              setLoaded(true);
            }}
          />
        </Suspense>
      ) : (
        <img
          src={fileUrl}
          alt="Event schedule"
          className="absolute inset-0 size-full object-contain p-(--space-16)"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
    </div>
  );
}

/**
 * The event schedule (PDF or image). Viewers see it and can download it; admins
 * upload it into the empty widget, replace it or remove it.
 */
function ScheduleWidget({ event, mode, id = "schedule" }: ScheduleWidgetProps) {
  const { org } = useOrg();
  const orgSlug = org.slug;
  const qc = useQueryClient();
  const { mutateAsync: requestUpload } = useRequestUpload();
  const [progress, setProgress] = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const replaceInput = useRef<HTMLInputElement>(null);
  // The board keeps every layer in the DOM, so the file would otherwise load
  // and pull in pdf.js on dashboard load. Mount it once the
  // widget first settles open, after its animation, and keep it so reopening
  // shows it at once. The board holds the open panel's size while it animates.
  const slot = useWidgetBoardSlot(id);
  const settledOpen = slot ? slot.state === "open" && !slot.animating : true;
  const [previewMounted, setPreviewMounted] = useState(false);
  if (settledOpen && !previewMounted) setPreviewMounted(true);

  const scheduleKey = event.schedulePdfUrl;
  const fileUrl = scheduleKey ? scheduleFileUrl(orgSlug, event.id) : null;
  const fileName = scheduleKey ? scheduleFileName(scheduleKey) : null;
  const isAdmin = mode === "admin";

  // Same flow as the old admin dashboard: presign, upload to R2, then save the key on the event.
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { key, url } = await requestUpload({
        body: { contentType: file.type, type: "schedule" },
      });

      setProgress(0);
      await uploadToCloudflare(url, file, setProgress);

      const { error } = await client.PATCH("/orgs/{slug}/events/{id}", {
        params: { path: { slug: orgSlug, id: event.id } },
        body: { schedulePdfUrl: key },
      });
      if (error) throw error;

      return key;
    },
    onSuccess: () => {
      void invalidateOrgEvents(qc, orgSlug);
      setProgress(null);
      toastManager.add({ title: "Schedule uploaded", type: "success" });
    },
    onError: () => {
      setProgress(null);
      toastManager.add({ title: "Failed to upload schedule", type: "error" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await client.PATCH("/orgs/{slug}/events/{id}", {
        params: { path: { slug: orgSlug, id: event.id } },
        body: { schedulePdfUrl: null },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void invalidateOrgEvents(qc, orgSlug);
      setConfirmRemove(false);
      toastManager.add({ title: "Schedule removed", type: "success" });
    },
    onError: () => {
      toastManager.add({ title: "Failed to remove schedule", type: "error" });
    },
  });

  const uploading = uploadMutation.isPending;

  function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_SIZE) {
      toastManager.add({
        title: "Error",
        description: "File is larger than 25 MB.",
        type: "error",
      });
      return;
    }
    uploadMutation.mutate(file);
  }

  // With a file, the page preview behind the peek says it all.
  const peek = fileName ? null : (
    <span className="text-fg-3 text-[12.5px] leading-[1.4]">
      No schedule yet
    </span>
  );

  const actions = (
    <>
      {fileName && (
        <span className="text-fg-2 bp-small:hidden mr-(--space-4) truncate font-mono text-[12px] leading-[1.4]">
          {fileName}
        </span>
      )}
      {fileUrl && !isAdmin && (
        <Button
          size="sm"
          render={
            // Cross-origin, so `download` may be ignored; the browser opens the file instead.
            <a href={fileUrl} target="_blank" rel="noreferrer" download />
          }
        >
          <Icon icon={DownloadSimpleIcon} />
          Download
        </Button>
      )}
      {fileUrl && isAdmin && (
        <>
          <Button
            size="sm"
            disabled={uploading}
            onClick={() => replaceInput.current?.click()}
          >
            <Icon icon={ArrowsClockwiseIcon} />
            {uploading ? "Uploading" : "Replace"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            label="Remove schedule"
            disabled={uploading || removeMutation.isPending}
            onClick={() => setConfirmRemove(true)}
          >
            <Icon icon={TrashIcon} />
          </Button>
          <input
            ref={replaceInput}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </>
      )}
    </>
  );

  let body: ReactNode;
  if (uploading && progress !== null && !fileUrl) {
    body = (
      <div className="flex h-full flex-col justify-center p-(--space-16)">
        <ProgressBar value={progress} label="Uploading schedule" />
      </div>
    );
  } else if (fileUrl && scheduleKey) {
    body = (
      <div className="relative h-full">
        <SchedulePreview
          // The URL stays the same across a replace; a new key reloads the file.
          key={scheduleKey}
          orgSlug={orgSlug}
          eventId={event.id}
          scheduleKey={scheduleKey}
          fileUrl={fileUrl}
          mounted={previewMounted}
        />
        {uploading && progress !== null && (
          <div className="bg-surface border-line absolute inset-x-0 bottom-0 border-t p-(--space-12)">
            <ProgressBar value={progress} label="Uploading schedule" />
          </div>
        )}
      </div>
    );
  } else if (isAdmin) {
    body = (
      <div className="flex h-full min-h-[240px] p-(--space-12)">
        <DropZone
          accept={ACCEPT}
          maxSize={MAX_SIZE}
          disabled={uploading}
          title="Drop a PDF or image, or"
          onFilesAccepted={(files) => upload(files[0])}
          onFileReject={(_, message) => {
            toastManager.add({
              title: "Error",
              description: message,
              type: "error",
            });
          }}
        />
      </div>
    );
  } else {
    body = (
      <div className="flex h-full flex-col items-center justify-center gap-(--space-10) p-(--space-16) text-center">
        <Icon icon={CalendarBlankIcon} size="xl" className="text-fg-3" />
        <p className="type-body text-fg-2 m-0">
          The organizer hasn&apos;t shared a schedule yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <Widget
        id={id}
        label="Schedule"
        icon={CalendarBlankIcon}
        peek={peek}
        peekBackground={
          scheduleKey ? (
            <SchedulePeekBackground
              // A replaced schedule draws its own first page.
              key={scheduleKey}
              orgSlug={orgSlug}
              eventId={event.id}
              scheduleKey={scheduleKey}
            />
          ) : undefined
        }
        actions={actions}
      >
        {body}
      </Widget>

      {isAdmin && (
        <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>Remove the schedule?</DialogTitle>
              <DialogDescription>
                Coaches and dancers won&apos;t see it until you upload a new
                one.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="ghost" size="lg" />}>
                Cancel
              </DialogClose>
              <Button
                variant="primary"
                size="lg"
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate()}
              >
                Remove schedule
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      )}
    </>
  );
}

export { ScheduleWidget };
export type { ScheduleWidgetProps };
