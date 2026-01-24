import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_settings/(routes)/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_settings/(routes)/settings"!</div>;
}
