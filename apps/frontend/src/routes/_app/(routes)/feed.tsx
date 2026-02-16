import { createFileRoute } from "@tanstack/react-router";

import { feedQueries } from "@/features/feed/api/queries";
import { FeedPage } from "@/features/feed/page";

export const Route = createFileRoute("/_app/(routes)/feed")({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(feedQueries.feed());
  },
  component: FeedPage,
});
