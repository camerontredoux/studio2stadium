import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HistoryIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { adminQueries } from "@/features/org/api/admin-queries";
import {
  AdminPlaceholder,
  SummaryStat,
} from "@/features/org/components/admin-placeholder";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/admin/uploads",
)({
  component: UploadsPage,
});

function UploadsPage() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const active = events?.find((e) => e.isActive);
  const statsQuery = useSuspenseQuery(
    adminQueries.stats(orgSlug, active?.id ?? ""),
  );
  const stats = statsQuery.data;

  const last = stats.recentUploads[0] ?? null;
  const totalUploads = stats.recentUploads.length;

  return (
    <AdminPlaceholder
      orgSlug={orgSlug}
      title="Upload history"
      subtitle="CSV uploads and their processing results"
      icon={HistoryIcon}
      emptyTitle="Upload history coming soon"
      emptyDescription={
        <>
          A paginated view of every CSV upload with results, re-download, and
          retry-failed-rows is landing in the next release.
        </>
      }
      summary={
        <>
          <SummaryStat
            label="Recent uploads"
            value={totalUploads.toLocaleString()}
            hint="last 5 on record"
          />
          <SummaryStat
            label="Last upload"
            value={
              last
                ? formatDistanceToNow(new Date(last.createdAt), {
                    addSuffix: true,
                  })
                : "—"
            }
            hint={last ? `${last.type} roster` : "no uploads yet"}
          />
          <SummaryStat
            label="Rows processed"
            value={stats.recentUploads
              .reduce(
                (sum, u) => sum + (u.rowsAdded ?? 0) + (u.rowsUpdated ?? 0),
                0,
              )
              .toLocaleString()}
            hint="across recent uploads"
          />
        </>
      }
    />
  );
}
