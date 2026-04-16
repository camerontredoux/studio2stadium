import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AdminSidebar } from "@/features/org/components/admin-sidebar";
import { AdminCommandPalette } from "@/features/org/components/admin-command-palette";
import { AdminCommandsProvider } from "@/features/org/hooks/use-admin-commands";
import { orgQueries } from "@/features/org/api/queries";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/admin")({
  beforeLoad: async ({ context, params }) => {
    const data = (await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    )) as { membership?: { role: string; type: string } | null } | null;
    const role = data?.membership?.role;
    if (role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
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
          </header>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </SidebarInset>
        <AdminCommandPalette />
      </SidebarProvider>
    </AdminCommandsProvider>
  );
}
