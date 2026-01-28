import { EventsSection } from "./sections/events-section";
import { ProgramsSection } from "./sections/programs-section";
import { StatsSection } from "./sections/stats-section";

export function Sidebar() {
  return (
    <aside className="hidden lg:block w-80 shrink-0">
      <div className="sticky top-16 space-y-2 xl:space-y-4">
        <EventsSection />
        <ProgramsSection />
        <StatsSection />
      </div>
    </aside>
  );
}
