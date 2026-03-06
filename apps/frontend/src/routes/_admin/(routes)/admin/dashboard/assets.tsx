import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/(routes)/admin/dashboard/assets")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_admin/(routes)/dashboard/assets"!</div>;
}
