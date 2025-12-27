import AppLayout from "@/components/layouts/app-layout";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

const isAuthenticated = false;

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    if (!isAuthenticated) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
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
