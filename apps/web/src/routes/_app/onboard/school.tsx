import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/onboard/school")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/(onboarding)/school"!</div>;
}
