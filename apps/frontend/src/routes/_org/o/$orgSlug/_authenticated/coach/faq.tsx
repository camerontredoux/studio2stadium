import { createFileRoute } from "@tanstack/react-router";

import { EventFaq } from "@/features/org/components/event-faq";
import { coachEventFaqSections } from "@/features/org/data/coach-event-faq";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/coach/faq",
)({
  component: CoachFaq,
});

function CoachFaq() {
  return (
    <EventFaq
      sections={coachEventFaqSections}
      subtitle="Common questions about scouting dancers with S2S Live at your event."
    />
  );
}
