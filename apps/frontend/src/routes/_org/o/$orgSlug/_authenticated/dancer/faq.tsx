import { createFileRoute } from "@tanstack/react-router";

import { EventFaq } from "@/features/org/components/event-faq";
import { dancerEventFaqSections } from "@/features/org/data/dancer-event-faq";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/faq",
)({
  component: DancerFaq,
});

function DancerFaq() {
  return (
    <EventFaq
      sections={dancerEventFaqSections}
      subtitle="Common questions about using S2S Live at your recruiting event."
    />
  );
}
