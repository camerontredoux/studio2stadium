import { createFileRoute, redirect } from "@tanstack/react-router";

import { feedQueries } from "@/features/feed/api/queries";
import { FeedPage } from "@/features/feed/page";
import { feedQueries as sharedFeedQueries } from "@/shared/feed/api/queries";

export const Route = createFileRoute("/_app/(routes)/feed")({
  beforeLoad: ({ context: { session } }) => {
    if (!session.verified) {
      throw redirect({ to: "/settings/application" });
    }
  },
  loader: async ({ context: { queryClient, session } }) => {
    if (session.type === "dancer") {
      queryClient.ensureQueryData(feedQueries.recommended());

      queryClient.ensureQueryData(sharedFeedQueries.dancerChecklist());
    }
    queryClient.ensureInfiniteQueryData(feedQueries.feed());
  },
  component: FeedPage,
});
