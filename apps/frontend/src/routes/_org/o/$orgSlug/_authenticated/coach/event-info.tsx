import { createFileRoute } from "@tanstack/react-router";

import { CoachDashboardPage } from "@/features/org/live/coach/coach-dashboard-page";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/coach/event-info",
)({
  component: CoachDashboardPage,
});
