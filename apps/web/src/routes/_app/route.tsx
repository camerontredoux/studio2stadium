import AppLayout from "@/components/layouts/app-layout";
import { auth } from "@/features/auth";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(auth.api.queries.session())

    if (!session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }

    return { session }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
