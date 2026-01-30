import { AppLayout } from "@/components/layouts/app-layout/app-layout";
import { Spinner } from "@/components/ui/spinner";
import { createAccess } from "@/lib/access/access";
import { SessionNetworkError } from "@/lib/session";
import {
  createFileRoute,
  Outlet,
  redirect,
  type ErrorComponentProps,
} from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    try {
      // const session = await context.queryClient.ensureQueryData(
      //   queries.session(),
      // );

      const mockSession = {
        id: "1",
        username: "test",
        email: "test@test.com",
        platforms: ["core"] as ("core" | "prodigy")[],
        type: "school" as const,
        role: "user" as const,
        avatar: null,
        displayEmail: "test@test.com",
        subscribed: false,
      };

      // if (!session) {
      // throw redirect({
      //   to: "/login",
      //   search: { redirect: location.href, reason: "access_denied" },
      // });
      // }

      // if (!session.platforms) {
      //   throw redirect({
      //     to: "/onboarding",
      //     replace: true,
      //   });
      // }

      return { session: mockSession, access: createAccess(mockSession) };
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
    <AppLayout>
      <Spinner />
    </AppLayout>
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
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
