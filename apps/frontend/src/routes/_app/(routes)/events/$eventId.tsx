import { queries } from "@/features/events/api/queries";
import { EventDetail } from "@/features/events/components/details/event-detail";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events/$eventId")({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(queries.event(params.eventId));
  },
  pendingMs: 200,
  component: RouteComponent,
});

function RouteComponent() {
  const { eventId } = Route.useParams();

  return <EventDetail eventId={eventId} />;
}
