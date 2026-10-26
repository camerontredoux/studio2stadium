import { createFileRoute } from "@tanstack/react-router";

import { DancerFaqPage } from "@/features/org/live/dancer/dancer-faq-page";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/faq",
)({
  component: DancerFaqPage,
});
