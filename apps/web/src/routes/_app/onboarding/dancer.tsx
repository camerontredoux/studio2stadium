import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/onboarding/dancer")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/(onboarding)/dancer"!</div>;
}
