import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/dashboard/metrics")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_admin/dashboard/metrics"!</div>;
}
