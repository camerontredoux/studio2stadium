import { createFileRoute } from "@tanstack/react-router";

import { AuditLogPage } from "@/features/org/live/admin/audit/audit-log-page";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/uploads",
)({
  component: AuditLogRoute,
});

function AuditLogRoute() {
  const { orgSlug } = Route.useParams();
  return <AuditLogPage orgSlug={orgSlug} />;
}
