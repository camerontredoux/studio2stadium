import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_account/account/general")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_settings/settings/general"!</div>;
}
