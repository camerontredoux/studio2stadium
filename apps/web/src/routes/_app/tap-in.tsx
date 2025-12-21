import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/tap-in")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/tap-in"!</div>;
}
