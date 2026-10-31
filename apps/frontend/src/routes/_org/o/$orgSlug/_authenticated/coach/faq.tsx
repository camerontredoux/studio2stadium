import { createFileRoute } from "@tanstack/react-router";

import { CoachFaqPage } from "@/features/org/live/coach/coach-faq-page";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/coach/faq",
)({
  component: CoachFaqPage,
});
