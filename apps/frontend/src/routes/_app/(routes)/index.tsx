import { createFileRoute } from "@tanstack/react-router";

import { Feed } from "@/features/feed/components/feed";

export const Route = createFileRoute("/_app/(routes)/")({
  component: Feed,
});
