import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/library"!</div>;
}
