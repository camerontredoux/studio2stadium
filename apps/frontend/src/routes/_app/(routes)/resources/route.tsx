import { ResourcesLayout } from "@/components/layouts/resources-layout";
import { AccessDenied } from "@/components/shared/access-denied";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources")({
  component: RouteComponent,
});

function RouteComponent() {
  const { subscription } = Route.useRouteContext();

  if (!subscription.subscribed) {
    return (
      <AccessDenied description="Resources is a premium feature. Subscribe to unlock this page and get full access." />
    );
  }

  return (
    <ResourcesLayout>
      <Outlet />
    </ResourcesLayout>
  );
}
