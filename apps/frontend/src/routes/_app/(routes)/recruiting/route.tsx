import { PremiumGuard } from "@/components/shared/premium-guard";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/recruiting")({
  beforeLoad: ({ context: { session } }) => {
    if (!session.verified) {
      throw redirect({ to: "/settings/application" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PremiumGuard description="Common Recruiting is a premium feature. Subscribe to unlock this page and get full access.">
      <Outlet />
    </PremiumGuard>
  );
}
