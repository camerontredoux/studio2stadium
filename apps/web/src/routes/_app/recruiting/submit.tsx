import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/recruiting/submit")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/recruiting/submit"!</div>;
}
