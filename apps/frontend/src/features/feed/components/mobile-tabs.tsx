import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { type ReactNode } from "react";
import { EventsSection } from "./sidebar/sections/events/upcoming-events-section";
import { ProgramsSection } from "./sidebar/sections/programs-section";
import { StatsSection } from "./sidebar/sections/stats-section";

interface MobileTabsProps {
  children: ReactNode;
}

export function MobileTabs({ children }: MobileTabsProps) {
  return (
    <div className="mobile:pb-0 w-full p-2 pt-0 lg:hidden">
      <Tabs defaultValue="feed">
        <TabsList
          className="bg-background sticky top-12 z-10 w-full border-b"
          variant="underline"
        >
          <TabsTab className="flex-1" value="feed">
            Feed
          </TabsTab>
          <TabsTab className="flex-1" value="discover">
            Discover
          </TabsTab>
        </TabsList>
        <TabsPanel className="mobile:pb-16" value="feed">
          {children}
        </TabsPanel>
        <TabsPanel className="mobile:pb-16 overflow-y-auto" value="discover">
          <div className="gap-2 space-y-2">
            <div className="break-inside-avoid">
              <EventsSection />
            </div>
            <div className="break-inside-avoid">
              <ProgramsSection />
            </div>
            <div className="break-inside-avoid">
              <StatsSection />
            </div>
          </div>
        </TabsPanel>
      </Tabs>
    </div>
  );
}
