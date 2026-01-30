import { ResourcesLayout } from "@/components/layouts/resources-layout";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ResourcesLayout>
      <Outlet />
    </ResourcesLayout>
  );
}
