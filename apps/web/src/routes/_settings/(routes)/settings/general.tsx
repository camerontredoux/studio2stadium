import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_settings/(routes)/settings/general")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_settings/settings/general"!</div>;
}
