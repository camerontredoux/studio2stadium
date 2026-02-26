import { AccessDenied } from "@/components/shared/access-denied";
import { useSession } from "@/lib/session";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/recruiting")({
  component: RouteComponent,
});

function RouteComponent() {
  const session = useSession();
  const { subscription } = Route.useRouteContext();

  if (!subscription.subscribed && session.type === "dancer") {
    return (
      <AccessDenied description="Common Recruiting is a premium feature. Subscribe to unlock this page and get full access." />
    );
  }

  return <Outlet />;
}
