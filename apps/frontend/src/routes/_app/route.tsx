import { AppLayout } from "@/components/layouts/app-layout/app-layout";
import { ErrorComponent } from "@/components/layouts/app-layout/error-layout";
import { PendingComponent } from "@/components/layouts/app-layout/pending-layout";
import { ToastProvider } from "@/components/ui/toast";
import { notificationQueries } from "@/features/notifications/api/queries";
import { createAccess } from "@/lib/access/access";
import { queries, SessionNetworkError } from "@/lib/session";
import { useRealtime } from "@/lib/session/hooks/use-realtime";
import { VideoProcessingProvider } from "@/lib/video-processing";
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

      if (session.type === "school") {
        const application = await context.queryClient.ensureQueryData(
          queries.application(session.type === "school"),
        );

        if (!application) {
          throw redirect({
            to: "/onboarding",
            replace: true,
          });
        }
      }

      if (!session.verified && session.type === "dancer") {
        throw redirect({
          to: "/onboarding",
          replace: true,
        });
      }

      context.queryClient.ensureQueryData(notificationQueries.count());

      return {
        session,
        access: createAccess(session),
      };
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
    <VideoProcessingProvider>
      <ToastProvider position="top-center">
        <RealtimeWrapper />
      </ToastProvider>
    </VideoProcessingProvider>
  );
}

function RealtimeWrapper() {
  useRealtime();

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
