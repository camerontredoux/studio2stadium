import { eventQueries } from "@/features/events/api/queries";
import { EventDetail } from "@/features/events/components/details/event-detail";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events/$eventId")({
  beforeLoad: ({ context: { session } }) => {
    if (!session.verified) {
      throw redirect({ to: "/settings/application" });
    }
  },
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(eventQueries.event(params.eventId));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { eventId } = Route.useParams();

  return <EventDetail eventId={eventId} />;
}
