import { AccessDenied } from "@/components/shared/access-denied";
import { useSession } from "@/lib/session";
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
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
  const session = useSession();
  const subscription = useSubscribed();

  if (!subscription.subscribed && session.type === "dancer") {
    return (
      <AccessDenied description="Common Recruiting is a premium feature. Subscribe to unlock this page and get full access." />
    );
  }

  return <Outlet />;
}
