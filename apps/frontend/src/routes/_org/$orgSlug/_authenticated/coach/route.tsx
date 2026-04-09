import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { CoachSidebar } from "@/features/org/components/coach-sidebar";
import { orgQueries } from "@/features/org/api/queries";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/coach")({
  beforeLoad: async ({ context, params }) => {
    const data = (await context.queryClient.ensureQueryData(
      orgQueries.org(params.orgSlug),
    )) as { membership?: { role: string; type: string } | null } | null;
    const role = data?.membership?.role;
    const type = data?.membership?.type;
    if (role !== "admin" && type !== "coach") {
      throw redirect({ to: "/" });
    }
  },
  component: CoachLayout,
});

function CoachLayout() {
  return (
    <SidebarProvider>
      <CoachSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-muted-foreground text-sm font-medium">
            Coach
          </span>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
