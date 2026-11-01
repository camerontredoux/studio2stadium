import { createFileRoute } from "@tanstack/react-router";

import { AdminDashboardPage } from "@/features/org/live/admin/dashboard/dashboard-page";

export const Route = createFileRoute("/_org/o/$orgSlug/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { orgSlug } = Route.useParams();
  return <AdminDashboardPage orgSlug={orgSlug} />;
}
