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

const LABELS: Record<CsvRosterType, { title: string; help: string }> = {
  dancer: {
    title: "Upload dancer roster",
    help: "CSV with email, firstName, lastName, bibNumber",
  },
  coach: {
    title: "Upload coach roster",
    help: "CSV with email, firstName, lastName, organization",
  },
};

export function CsvUploadTriggerCard({
  orgSlug,
  eventId,
  type,
  icon,
  lastUpload,
}: CsvUploadTriggerCardProps) {
  const [open, setOpen] = useState(false);
  const { title, help } = LABELS[type];

  useAdminCommandListener(
    (a) => a.type === "open-upload" && a.kind === type,
    () => setOpen(true),
  );

  const lastLabel = lastUpload
    ? `Last upload · ${formatDistanceToNow(new Date(lastUpload.createdAt), { addSuffix: true })}`
    : "No uploads yet";

  const lastMeta = lastUpload
    ? `${lastUpload.rowsAdded + lastUpload.rowsUpdated} rows${
        lastUpload.rowsErrored > 0 ? ` · ${lastUpload.rowsErrored} errors` : ""
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
        <CardContent className="flex items-start gap-4 py-5">
          <div
            className={cn(
              "bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform",
              "group-hover:scale-105",
            )}
          >
            {icon}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-muted-foreground text-xs">{help}</p>
            <div className="mt-2 flex flex-col gap-0.5">
              <span className="text-foreground/80 text-xs font-medium">
                {lastLabel}
              </span>
              <span className="text-muted-foreground text-[11px]">
                {lastMeta}
              </span>
            </div>
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
