import { coachEventFaqSections } from "@/features/org/data/coach-event-faq";
import { SubpageHeader } from "@/features/org/live/shared/event-header";
import { FaqPage } from "@/features/org/live/shared/faq-page";
import { ShellPage } from "@/features/org/live/shared/shell-slots";
import { useActiveOrgEvent } from "@/features/org/live/shared/use-active-org-event";

/** The coach FAQ: the shared FAQ panel under an "Event / FAQ" header. */
export function CoachFaqPage() {
  const { event } = useActiveOrgEvent();
  return (
    <ShellPage
      header={
        <SubpageHeader
          event={event}
          title="FAQ"
          dashboardTo="/o/$orgSlug/coach/event-info"
          showStatus
        />
      }
    >
      <FaqPage sections={coachEventFaqSections} />
    </ShellPage>
  );
}
