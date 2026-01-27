import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings/media")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_settings/settings/media"!</div>;
}
