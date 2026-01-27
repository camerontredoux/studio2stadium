import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_settings/settings/profile"!</div>;
}
