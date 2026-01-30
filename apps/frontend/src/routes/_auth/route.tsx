import { AuthLayout } from "@/components/layouts/auth-layout";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: ({ context }) => {
    // Don't need to fetch session, just need to check if cache exists
    const session = context.queryClient.getQueryData(["session"]);

    if (session) {
      throw redirect({ to: "/feed", replace: true });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  );
}
