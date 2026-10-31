import { createFileRoute, redirect } from "@tanstack/react-router";

import { orgQueries } from "@/features/org/api/queries";
import { hasOrgFeature } from "@/features/org/lib/entitlement";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { CallbacksPage } from "@/features/org/live/admin/dashboard/callbacks-page";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/callbacks",
)({
  beforeLoad: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    );
    if (!hasOrgFeature(data, "callbacks")) {
      throw redirect({ to: "/o/$orgSlug/admin", params });
    }
  },
  // Warms the page's two queries so it opens without a loading state.
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureInfiniteQueryData(
        scoutingQueries.adminCallbackPages(params.orgSlug),
      ),
      context.queryClient.ensureQueryData(
        scoutingQueries.showcases(params.orgSlug),
      ),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { orgSlug } = Route.useParams();
  return <CallbacksPage orgSlug={orgSlug} />;
}
