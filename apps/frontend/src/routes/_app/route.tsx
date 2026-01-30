import { AppLayout } from "@/components/layouts/app-layout/app-layout";
import { ErrorComponent } from "@/components/layouts/app-layout/error-layout";
import { PendingComponent } from "@/components/layouts/app-layout/pending-layout";
import { createAccess } from "@/lib/access/access";
import { queries, SessionNetworkError } from "@/lib/session";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    try {
      const session = await context.queryClient.ensureQueryData(
        queries.session(),
      );

      if (!session) {
        throw redirect({
          to: "/login",
          search: { redirect: location.href, reason: "access_denied" },
        });
      }

      if (!session.platforms) {
        throw redirect({
          to: "/onboarding",
          replace: true,
        });
      }

      return { session, access: createAccess(session) };
    } catch (error) {
      if (error instanceof SessionNetworkError) {
        throw redirect({
          to: "/login",
          search: { redirect: location.href, reason: "network_error" },
        });
      }
      throw error;
    }
  },
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
