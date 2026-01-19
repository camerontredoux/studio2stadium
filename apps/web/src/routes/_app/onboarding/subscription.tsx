import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/onboarding/subscription")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/(onboarding)/subscribe"!</div>;
}
