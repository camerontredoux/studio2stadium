import { createFileRoute } from "@tanstack/react-router";

import { FeedPage } from "@/features/feed/page";

export const Route = createFileRoute("/_app/(routes)/feed")({
  component: FeedPage,
});
