import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/unauthorized")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_app/(routes)/unauthorized"!</div>;
}
