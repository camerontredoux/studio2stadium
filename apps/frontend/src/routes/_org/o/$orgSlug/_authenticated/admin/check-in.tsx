import { createFileRoute } from "@tanstack/react-router";

import { CheckInDeskPage } from "@/features/org/live/admin/check-in-desk/check-in-desk-page";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/check-in",
)({
  component: CheckInDeskRoute,
});

function CheckInDeskRoute() {
  const { orgSlug } = Route.useParams();
  return <CheckInDeskPage orgSlug={orgSlug} />;
}
