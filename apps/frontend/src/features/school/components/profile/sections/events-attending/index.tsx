import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import type { SchoolProfile } from "@/features/school/types";
import { GlobalEvents } from "./global-events";

type GlobalEventsType = SchoolProfile["globalEvents"];

export function EventsAttending({
  globalEvents,
}: {
  globalEvents: GlobalEventsType;
}) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Attending Events</FrameTitle>
      </FrameHeader>
      <FramePanel className="p-0!">
        <GlobalEvents events={globalEvents} />
      </FramePanel>
    </Frame>
  );
}
