import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/reset/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_auth/reset/"!</div>;
}
