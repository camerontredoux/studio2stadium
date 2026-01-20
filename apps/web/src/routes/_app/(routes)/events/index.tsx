import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Event</div>
}
