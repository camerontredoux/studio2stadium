import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/events/$eventId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { eventId } = Route.useParams();
  return <div>Hello `/_app/events/{eventId}`!</div>;
}
