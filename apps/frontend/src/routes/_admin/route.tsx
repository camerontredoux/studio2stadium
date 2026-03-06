import { ToastProvider } from "@/components/ui/toast";
import { queries } from "@/lib/session";
import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(
      queries.session(),
    );

    if (!session || session.role !== "admin") {
      throw redirect({ to: "/login", replace: true });
    }

    return { session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
            <Link to="/admin/dashboard" className="text-lg font-semibold">
              Admin
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link
                to="/admin/applications"
                className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
              >
                Applications
              </Link>
              <Link
                to="/admin/school-events"
                className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
              >
                School Events
              </Link>
              <Link
                to="/admin/global-events"
                className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
              >
                Global Events
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  );
}
