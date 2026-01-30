import { EventDetail } from "@/features/events/components/event-detail";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events/$eventId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { eventId } = Route.useParams();
  return <EventDetail eventId={eventId} />;
}
