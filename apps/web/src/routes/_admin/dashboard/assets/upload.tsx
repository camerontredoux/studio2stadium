import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/dashboard/assets/upload")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_admin/dashboard/assets/upload"!</div>;
}
