import { AuthLayout } from "@/components/layouts/auth-layout";
import { Spinner } from "@/components/ui/spinner";
import { queries, SessionNetworkError } from "@/lib/session";
import {
  createFileRoute,
  Outlet,
  redirect,
  type ErrorComponentProps,
} from "@tanstack/react-router";

export const Route = createFileRoute("/_onboarding")({
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

      if (session.platforms) {
        throw redirect({
          to: "/",
          replace: true,
        });
      }

      return { session };
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

function PendingComponent() {
  return (
    <div className="max-w-7xl mx-auto h-screen flex items-center justify-center">
      <Spinner />
    </div>
  );
}

function ErrorComponent({ error }: ErrorComponentProps) {
  return (
    <div className="max-w-7xl mx-auto h-screen flex items-center justify-center">
      <div>Error: {error.message}</div>
    </div>
  );
}

function RouteComponent() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}
