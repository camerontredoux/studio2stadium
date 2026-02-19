import { eventQueries } from "@/features/events/api/queries";
import { GlobalEventsPage } from "@/features/events/pages/global";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events/global")({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(eventQueries.globalEvents());
  },
  component: GlobalEventsPage,
});
