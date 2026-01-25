import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/reset/$tokenId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_auth/reset/$tokenId"!</div>;
}
