import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DancerSidebar } from "@/features/org/components/dancer-sidebar";
import { PreviewModeBanner } from "@/features/org/components/preview-mode-banner";
import { orgQueries } from "@/features/org/api/queries";
import { queries } from "@/lib/session";

export const Route = createFileRoute("/_org/o/$orgSlug/_authenticated/dancer")({
  beforeLoad: async ({ context, params }) => {
    const session = await context.queryClient.ensureQueryData(
      queries.session(),
    );
    if (session?.role === "admin") return;

    const data = (context.queryClient.getQueryData(
      orgQueries.org(params.orgSlug).queryKey,
    ) ??
      (await context.queryClient.ensureQueryData(
        orgQueries.org(params.orgSlug),
      ))) as {
      membership?: { role: string; type: string } | null;
      myRosters?: Array<{ id: string; type: string }>;
    } | null;
    const role = data?.membership?.role;
    const type = data?.membership?.type;
    if (role !== "admin" && role !== "owner" && type !== "dancer") {
      throw redirect({ to: "/" });
    }
    const hasDancerRoster = data?.myRosters?.some(
      (roster) => roster.type === "dancer",
    );
    if (role !== "admin" && !hasDancerRoster) {
      throw redirect({
        to: "/o/$orgSlug/no-access",
        params: { orgSlug: params.orgSlug },
      });
    }
  },
  component: DancerLayout,
});

function DancerLayout() {
  const { orgSlug } = Route.useParams();
  return (
    <SidebarProvider className="h-svh">
      <DancerSidebar />
      <SidebarInset className="overflow-hidden">
        <header className="bg-sidebar text-sidebar-foreground flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-muted-foreground text-sm font-medium 2xl:text-base">
            Dancer
          </span>
        </header>
        <PreviewModeBanner role="dancer" orgSlug={orgSlug} />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
