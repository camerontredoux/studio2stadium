import { createFileRoute, stripSearchParams } from "@tanstack/react-router";

import { rosterSearchSchema } from "@/features/org/live/admin/rosters/roster-config";
import { RosterPage } from "@/features/org/live/admin/rosters/roster-page";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/dancers",
)({
  validateSearch: rosterSearchSchema,
  search: { middlewares: [stripSearchParams({ status: "all" })] },
  component: DancersPage,
});

function DancersPage() {
  const { orgSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <RosterPage
      type="dancer"
      orgSlug={orgSlug}
      search={search}
      onSearchChange={(patch) =>
        navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
      }
    />
  );
}
