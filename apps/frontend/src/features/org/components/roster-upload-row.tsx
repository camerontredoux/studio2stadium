import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils/cn";
import { CsvUploadDialog } from "./csv-upload-dialog";
import { useAdminCommandListener } from "@/features/org/hooks/use-admin-commands";
import type { CsvUploadSummary } from "@/features/org/api/admin-queries";
import {
  rosterQueries,
  type RosterType,
} from "@/features/org/api/roster-queries";

interface RosterUploadRowProps {
  orgSlug: string;
  eventId: string;
  type: RosterType;
  lastUpload: CsvUploadSummary | null;
}

const TITLES: Record<RosterType, string> = {
  dancer: "Dancer roster",
  coach: "Coach roster",
};

const PREVIEW_LIMIT = 5;

export function RosterUploadRow({
  orgSlug,
  eventId,
  type,
  lastUpload,
}: RosterUploadRowProps) {
  const [open, setOpen] = useState(false);

  useAdminCommandListener(
    (a) => a.type === "open-upload" && a.kind === type,
    () => setOpen(true),
  );

  const listQuery = useQuery({
    ...rosterQueries.list(orgSlug, eventId, {
      type,
      page: 0,
      limit: PREVIEW_LIMIT,
      sortBy: "createdAt",
      sortDir: "desc",
    }),
  });

  const title = TITLES[type];
  const metadata = buildMetadata(lastUpload);
  const rows = listQuery.data?.data ?? [];
  const total = listQuery.data?.total ?? 0;
  const listPath =
    type === "dancer" ? "/$orgSlug/admin/dancers" : "/$orgSlug/admin/coaches";

  return (
    <>
      <div className="border-border flex min-h-0 flex-col overflow-hidden rounded-md border">
        <div className="border-border bg-muted/40 flex items-center justify-between gap-3 border-b px-3 py-2">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
                {title}
              </span>
              <span className="text-muted-foreground text-[11px] tabular-nums 2xl:text-xs">
                {total.toLocaleString()}
              </span>
            </div>
            <span className="text-muted-foreground truncate text-[11px] 2xl:text-xs">
              {metadata}
            </span>
          </div>
          <Button
            variant="outline"
            size="xs"
            className="gap-1.5"
            onClick={() => setOpen(true)}
          >
            <UploadIcon />
            Upload
          </Button>
        </div>

        <div className="relative flex-1">
          {rows.length === 0 ? (
            <div className="text-muted-foreground flex h-[156px] items-center justify-center text-xs">
              {listQuery.isLoading ? "Loading…" : "No entries yet"}
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-border border-b">
                  {type === "dancer" && (
                    <th className="text-muted-foreground w-12 px-3 py-1.5 text-left text-[10px] font-medium tracking-wide uppercase 2xl:text-xs">
                      Bib
                    </th>
                  )}
                  <th className="text-muted-foreground px-3 py-1.5 text-left text-[10px] font-medium tracking-wide uppercase 2xl:text-xs">
                    Name
                  </th>
                  <th className="text-muted-foreground hidden px-3 py-1.5 text-left text-[10px] font-medium tracking-wide uppercase sm:table-cell 2xl:text-xs">
                    Organization
                  </th>
                  <th className="text-muted-foreground w-32 px-3 py-1.5 text-center text-[10px] font-medium tracking-wide uppercase 2xl:text-xs">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-border hover:bg-muted/30 border-b transition-colors last:border-b-0"
                  >
                    {type === "dancer" && (
                      <td className="px-3 py-1.5 text-xs font-medium tabular-nums 2xl:text-sm">
                        {row.bibNumber ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-3 py-1.5 text-xs font-medium 2xl:text-sm">
                      <span className="truncate">
                        {row.firstName} {row.lastName}
                      </span>
                    </td>
                    <td className="text-muted-foreground hidden px-3 py-1.5 text-xs sm:table-cell 2xl:text-sm">
                      <span className="truncate">
                        {row.organization ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex justify-center">
                        <StatusDot isRegistered={row.isRegistered} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-border bg-background/60 flex items-center justify-between border-t px-3 py-1.5">
          <span className="text-muted-foreground text-[10px] tracking-wide uppercase 2xl:text-xs">
            Most recent
          </span>
          <Link
            to={listPath}
            params={{ orgSlug }}
            className="text-foreground hover:text-brand inline-flex items-center gap-1 text-[11px] font-medium 2xl:text-xs"
          >
            View all
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>
      </div>

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

function StatusDot({ isRegistered }: { isRegistered: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-22 items-center justify-center gap-1.5 text-[10px] tracking-wide uppercase tabular-nums",
        isRegistered ? "text-success-foreground" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isRegistered ? "bg-success" : "bg-muted-foreground/50",
        )}
        aria-hidden
      />
      {isRegistered ? "Active" : "Pending"}
    </span>
  );
}

function buildMetadata(lastUpload: CsvUploadSummary | null): string {
  if (!lastUpload) return "No uploads yet";
  const when = formatDistanceToNow(new Date(lastUpload.createdAt), {
    addSuffix: true,
  });
  const touched = (lastUpload.rowsAdded ?? 0) + (lastUpload.rowsUpdated ?? 0);
  const errors = lastUpload.rowsErrored ?? 0;
  const rowsPart = `${touched.toLocaleString()} row${touched === 1 ? "" : "s"}`;
  const errorsPart =
    errors > 0 ? ` · ${errors} error${errors === 1 ? "" : "s"}` : "";
  return `Last upload ${when} · ${rowsPart}${errorsPart}`;
}
