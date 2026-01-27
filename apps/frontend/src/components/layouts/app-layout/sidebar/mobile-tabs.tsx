import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { type ReactNode } from "react";
import { EventsSection } from "./sections/events-section";
import { ProgramsSection } from "./sections/programs-section";
import { StatsSection } from "./sections/stats-section";

interface MobileTabsProps {
  children: ReactNode;
}

export function MobileTabs({ children }: MobileTabsProps) {
  return (
    <div className="lg:hidden w-full p-2 pt-0 mobile:pb-0">
      <Tabs defaultValue="feed">
        <TabsList
          className="w-full sticky top-12 bg-background z-10 shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1)]"
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
          <div className="columns-1 sm:columns-2 gap-2 space-y-2">
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
