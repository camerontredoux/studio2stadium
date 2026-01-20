import { AuthLayout } from "@/components/layouts/auth-layout";
import { auth } from "@/features/auth";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(auth.api.queries.session())

    if (!session) {
      throw redirect({ to: "/", replace: true })
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
