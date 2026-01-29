import { SidebarWrapper } from "@/components/shared/sidebar-wrapper";
import { EventsSection } from "./sections/events-section";
import { ProgramsSection } from "./sections/programs-section";
import { StatsSection } from "./sections/stats-section";

export function FeedSidebar() {
  return (
    <SidebarWrapper>
      <EventsSection />
      <ProgramsSection />
      <StatsSection />
    </SidebarWrapper>
  );
}
