import { AppLayout } from "@/components/layouts/app-layout/app-layout";
import { ErrorComponent } from "@/components/layouts/app-layout/error-layout";
import { PendingComponent } from "@/components/layouts/app-layout/pending-layout";
import { ToastProvider } from "@/components/ui/toast";
import { createAccess } from "@/lib/access/access";
import { queries, SessionNetworkError } from "@/lib/session";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    try {
      const session = await context.queryClient.ensureQueryData(
        queries.session(),
      );

      const subscription = await context.queryClient.ensureQueryData(
        queries.subscribed(),
      );

      if (!session) {
        throw redirect({
          to: "/login",
          search: { redirect: location.href, reason: "access_denied" },
        });
      }

      if (!session.verified) {
        throw redirect({
          to: "/onboarding",
          replace: true,
        });
      }

      return { session, access: createAccess(session), subscription };
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
    <ToastProvider position="top-center">
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ToastProvider>
  );
}
