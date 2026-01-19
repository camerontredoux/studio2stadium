import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/events/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Event</div>
}
