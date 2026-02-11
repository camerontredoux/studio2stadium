import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings/_settings/membership")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/(routes)/settings/membership"!</div>;
}
