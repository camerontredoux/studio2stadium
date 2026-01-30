import { createFileRoute } from "@tanstack/react-router";

import { Page } from "@/features/feed/components/page";

export const Route = createFileRoute("/_app/(routes)/feed")({
  component: Page,
});
