import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { rosterSearchSchema } from "@/features/org/live/admin/rosters/roster-config";
import { RosterPage } from "@/features/org/live/admin/rosters/roster-page";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/coaches",
)({
  validateSearch: rosterSearchSchema,
  search: { middlewares: [stripSearchParams({ status: "all" })] },
  component: CoachesPage,
});

function CoachesPage() {
  const { orgSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <RosterPage
      type="coach"
      orgSlug={orgSlug}
      search={search}
      onSearchChange={(patch) =>
        navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
      }
    />
  );
}
