import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/onboard/subscription")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/(onboarding)/subscribe"!</div>;
}
