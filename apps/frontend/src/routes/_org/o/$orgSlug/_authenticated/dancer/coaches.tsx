import { createFileRoute } from "@tanstack/react-router";

import { DancerCoachesPage } from "@/features/org/live/dancer/coaches-page";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/coaches",
)({
  component: DancerCoachesPage,
});
