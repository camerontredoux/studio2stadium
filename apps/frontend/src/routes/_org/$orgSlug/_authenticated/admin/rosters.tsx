import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { UsersIcon } from "lucide-react";
import { adminQueries } from "@/features/org/api/admin-queries";
import {
  AdminPlaceholder,
  SummaryStat,
} from "@/features/org/components/admin-placeholder";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/admin/rosters",
)({
  component: RostersPage,
});

function RostersPage() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const active = events?.find((e) => e.isActive);

  const statsQuery = useSuspenseQuery(
    adminQueries.stats(orgSlug, active?.id ?? ""),
  );
  const stats = statsQuery.data;

  return (
    <AdminPlaceholder
      orgSlug={orgSlug}
      title="Rosters"
      subtitle={
        active
          ? `Dancers and coaches registered for ${active.name}`
          : "No active event"
      }
      icon={UsersIcon}
      emptyTitle="Full roster view coming soon"
      emptyDescription={
        <>
          Search, filter, and per-row editing land in the next release. In the
          meantime, upload rosters from the dashboard.
        </>
      }
      summary={
        <>
          <SummaryStat
            label="Dancers"
            value={stats.dancers.toLocaleString()}
            hint="on roster"
          />
          <SummaryStat
            label="Coaches"
            value={stats.coaches.toLocaleString()}
            hint="on roster"
          />
          <SummaryStat
            label="Activation"
            value={`${stats.dancers + stats.coaches === 0 ? 0 : Math.round((stats.registered / (stats.dancers + stats.coaches)) * 100)}%`}
            hint={`${stats.registered.toLocaleString()} activated`}
          />
        </>
      }
    />
  );
}
