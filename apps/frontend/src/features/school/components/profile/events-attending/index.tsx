import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import type { SchoolProfile } from "@/features/school/types";
import { GlobalEvents } from "./global-events";
import { SchoolEvents } from "./school-events";

type Events = SchoolProfile["attendingEvents"];
type GlobalEventsType = SchoolProfile["globalEvents"];

export function EventsAttending({
  events,
  globalEvents,
}: {
  events: Events;
  globalEvents: GlobalEventsType;
}) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Events Attending</FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        <Tabs defaultValue="schools">
          <div className="p-2">
            <TabsList className="w-full">
              <TabsTab value="schools">Schools</TabsTab>
              <TabsTab value="global">Global</TabsTab>
            </TabsList>
          </div>
          <TabsPanel value="schools">
            <SchoolEvents events={events} />
          </TabsPanel>
          <TabsPanel value="global" className="divide-y">
            <GlobalEvents events={globalEvents} />
          </TabsPanel>
        </Tabs>
      </FramePanel>
    </Frame>
  );
}
