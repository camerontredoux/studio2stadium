import { createFileRoute } from "@tanstack/react-router";

import { ReconciliationPage } from "@/features/org/live/admin/dashboard/reconciliation-page";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/reconciliation",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { orgSlug } = Route.useParams();
  return <ReconciliationPage orgSlug={orgSlug} />;
}
