import {
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  DownloadSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useRef, useState } from "react";

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
import { toastManager } from "@/components/ui/toast-manager";
import {
  invalidateOrgEvents,
  type OrgEvent,
} from "@/features/org/api/admin-queries";
import { scheduleFileUrl } from "@/features/org/components/dashboard-shared";
import { useOrg } from "@/features/org/context/use-org";
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
    <span className="s2s-doc-bg" aria-hidden="true">
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
    </span>
  );
}

function SchedulePreview({
  fileUrl,
  isPdf,
}: {
  fileUrl: string;
  isPdf: boolean;
}) {
  return (
    <div className="bg-bg-150 relative h-full min-h-[320px]">
      {isPdf ? (
        <iframe
          src={fileUrl}
          title="Event schedule"
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <img
          src={fileUrl}
          alt="Event schedule"
          className="absolute inset-0 size-full object-contain p-(--space-16)"
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

  const peek = fileName ? (
    <span className="text-fg truncate font-mono text-[12px] leading-[1.4]">
      {fileName}
    </span>
  ) : (
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
          fileUrl={fileUrl}
          isPdf={scheduleKey.toLowerCase().endsWith(".pdf")}
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
        peekBackground={fileName ? <ScheduleSheet /> : undefined}
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
