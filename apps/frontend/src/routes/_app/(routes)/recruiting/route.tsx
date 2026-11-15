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
    <PremiumGuard
      premium
      description="Common Recruit submissions need a Monthly, Season Pass, or Annual plan. Upgrade to unlock this page."
    >
      <Outlet />
    </PremiumGuard>
  );
}
