import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { adminQueries } from "@/features/org/api/admin-queries";
import { AdminEventProvider } from "@/features/org/context/admin-event-provider";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { AdminAreaShell } from "@/features/org/live/admin/admin-shell";
import { orgQueries } from "@/features/org/api/queries";
import { queries } from "@/lib/session";
import {
  ORG_AREA_ROUTES,
  resolveOrgArea,
} from "@/features/org/lib/org-destination";

export const Route = createFileRoute("/_org/o/$orgSlug/_authenticated/admin")({
  beforeLoad: async ({ context, params }) => {
    const session = await context.queryClient.ensureQueryData(
      queries.session(),
    );
    if (session?.role === "admin") return;

    const data = await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    );
    const area = resolveOrgArea(data);
    if (area !== "admin") {
      throw redirect({
        to: ORG_AREA_ROUTES[area],
        params: { orgSlug: params.orgSlug },
      });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));

  return (
    <AdminEventProvider events={events}>
      <AdminShell />
    </AdminEventProvider>
  );
}

function AdminShell() {
  const { selectedEvent } = useAdminEvent();

  return (
    <AdminAreaShell>
      <Outlet key={selectedEvent?.id ?? "no-event"} />
    </AdminAreaShell>
  );
}
