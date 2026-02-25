import { createFileRoute } from "@tanstack/react-router";

import { feedQueries } from "@/features/feed/api/queries";
import { FeedPage } from "@/features/feed/page";
import { feedQueries as sharedFeedQueries } from "@/shared/feed/api/queries";

export const Route = createFileRoute("/_app/(routes)/feed")({
  loader: async ({ context: { queryClient } }) => {
    const recommended = await queryClient.ensureQueryData(
      feedQueries.recommended(),
    );
    if (recommended.length === 0) {
      queryClient.ensureQueryData(sharedFeedQueries.dancerChecklist());
    }
    queryClient.ensureInfiniteQueryData(feedQueries.feed());
  },
  component: FeedPage,
});
