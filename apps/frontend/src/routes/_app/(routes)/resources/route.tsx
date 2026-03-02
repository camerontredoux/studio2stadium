import { ResourcesLayout } from "@/components/layouts/resources-layout";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources")({
  beforeLoad: ({ context: { session } }) => {
    if (!session.verified) {
      throw redirect({ to: "/settings/application" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ResourcesLayout>
      <Outlet />
    </ResourcesLayout>
  );
}
