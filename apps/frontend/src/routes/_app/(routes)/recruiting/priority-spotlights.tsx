import { feedQueries } from "@/features/feed/api/queries";
import { PrioritySpotlightsPage } from "@/features/recruiting/components/priority-spotlights/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/(routes)/recruiting/priority-spotlights",
)({
  beforeLoad: ({ context: { access } }) => {
    access.guard(access.is("core", "school"));
  },
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(feedQueries.prioritySpotlights());
  },
  component: PrioritySpotlightsPage,
});
