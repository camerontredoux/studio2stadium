import { EventsSection } from "./sections/events-section";
import { ProgramsSection } from "./sections/programs-section";
import { StatsSection } from "./sections/stats-section";

export function SideInfo() {
  return (
    <aside className="hidden lg:block w-80 xl:w-96 shrink-0">
      <div className="sticky top-12 pl-0 p-2 xl:pl-2 xl:p-4 space-y-2 xl:space-y-4">
        <EventsSection />
        <ProgramsSection />
        <StatsSection />
      </div>
    </aside>
  );
}
