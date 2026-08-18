import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { adminQueries } from "@/features/org/api/admin-queries";
import { AdminCommandPalette } from "@/features/org/components/admin-command-palette";
import { AdminSidebar } from "@/features/org/components/admin-sidebar";
import { OrgEventSwitcher } from "@/features/org/components/org-event-switcher";
import { AdminEventProvider } from "@/features/org/context/admin-event-provider";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { AdminCommandsProvider } from "@/features/org/hooks/use-admin-commands";
import { orgQueries } from "@/features/org/api/queries";
import { queries } from "@/lib/session";
import {
  ORG_AREA_ROUTES,
  resolveOrgArea,
  type OrgAccess,
} from "@/features/org/lib/org-destination";

export const Route = createFileRoute("/_org/o/$orgSlug/_authenticated/admin")({
  beforeLoad: async ({ context, params }) => {
    const session = await context.queryClient.ensureQueryData(
      queries.session(),
    );
    if (session?.role === "admin") return;

    const data = (await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    )) as OrgAccess | null;
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
      <AdminShell orgSlug={orgSlug} />
    </AdminEventProvider>
  );
}

function AdminShell({ orgSlug }: { orgSlug: string }) {
  const { selectedEvent } = useAdminEvent();

  return (
    <AdminCommandsProvider>
      <SidebarProvider className="h-svh">
        <AdminSidebar />
        <SidebarInset className="overflow-hidden">
          <header className="bg-sidebar text-sidebar-foreground flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-muted-foreground text-sm font-medium 2xl:text-base">
              Admin
            </span>
            <div className="ml-auto">
              <OrgEventSwitcher orgSlug={orgSlug} />
            </div>
          </header>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <Outlet key={selectedEvent?.id ?? "no-event"} />
          </div>
        </SidebarInset>
        <AdminCommandPalette />
      </SidebarProvider>
    </AdminCommandsProvider>
  );
}
