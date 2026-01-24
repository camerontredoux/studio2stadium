import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/school/$username/recruiting")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/(routes)/school/$username/recruiting"!</div>;
}
