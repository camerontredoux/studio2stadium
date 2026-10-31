import { createFileRoute } from "@tanstack/react-router";

import { CoachDancersPage } from "@/features/org/live/coach/coach-dancers-page";

export const Route = createFileRoute("/_org/o/$orgSlug/_authenticated/coach/dancers/")({
  component: CoachDancersPage,
});
