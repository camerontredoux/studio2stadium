import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/components/utils/cn";
import { CsvUploadDialog } from "./csv-upload-dialog";
import type { CsvUploadSummary } from "@/features/org/api/admin-queries";
import type { CsvRosterType } from "@/features/org/lib/csv-schemas";
import { formatDistanceToNow } from "date-fns";
import { useState, type ReactNode } from "react";
import { useAdminCommandListener } from "@/features/org/hooks/use-admin-commands";

interface CsvUploadTriggerCardProps {
  orgSlug: string;
  eventId: string;
  type: CsvRosterType;
  icon: ReactNode;
  lastUpload: CsvUploadSummary | null;
}

const LABELS: Record<CsvRosterType, string> = {
  dancer: "Upload dancer roster",
  coach: "Upload coach roster",
};

export function CsvUploadTriggerCard({
  orgSlug,
  eventId,
  type,
  icon,
  lastUpload,
}: CsvUploadTriggerCardProps) {
  const [open, setOpen] = useState(false);
  const title = LABELS[type];

  useAdminCommandListener(
    (a) => a.type === "open-upload" && a.kind === type,
    () => setOpen(true),
  );

  const lastLabel = lastUpload
    ? `Last upload · ${formatDistanceToNow(new Date(lastUpload.createdAt), { addSuffix: true })}`
    : "No uploads yet";

  const lastMeta = lastUpload
    ? `${((lastUpload.rowsAdded ?? 0) + (lastUpload.rowsUpdated ?? 0)).toLocaleString()} rows${
        (lastUpload.rowsErrored ?? 0) > 0
          ? ` · ${lastUpload.rowsErrored} errors`
          : ""
      }`
    : "Click to upload your first roster";

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "group cursor-pointer transition-all duration-200",
          "hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        )}
      >
        <CardContent className="flex items-center gap-3">
          <div
            className={cn(
              "bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform",
              "group-hover:scale-105",
            )}
          >
            {icon}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="font-semibold leading-tight">{title}</h3>
            <span className="text-muted-foreground truncate text-xs">
              {lastLabel} · {lastMeta}
            </span>
          </div>
        </CardContent>
      </Card>
      <CsvUploadDialog
        orgSlug={orgSlug}
        eventId={eventId}
        type={type}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
