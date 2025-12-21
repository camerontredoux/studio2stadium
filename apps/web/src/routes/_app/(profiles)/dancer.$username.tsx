import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(profiles)/dancer/$username")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/dancer/$username"!</div>;
}
