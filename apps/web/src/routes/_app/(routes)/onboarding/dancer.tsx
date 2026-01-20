import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/onboarding/dancer")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/(onboarding)/dancer"!<Link to="/login">Login</Link></div>;
}
