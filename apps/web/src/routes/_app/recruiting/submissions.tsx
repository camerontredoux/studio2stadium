import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/recruiting/submissions")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/recruiting/submissions"!</div>;
}
