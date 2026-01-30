import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import { UpcomingEvent } from "./upcoming-event";

export function EventsSection() {
  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Upcoming Events
          <Button className="ml-auto" size="xs" render={<Link to="/events" />}>
            View All
          </Button>
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        <Link
          to="/events/$eventId"
          params={{
            eventId: "121",
          }}
        >
          <UpcomingEvent />
        </Link>
        <Separator />
        <Link
          to="/events/$eventId"
          params={{
            eventId: "122",
          }}
        >
          <UpcomingEvent />
        </Link>
        <Separator />
        <Link
          to="/events/$eventId"
          params={{
            eventId: "123",
          }}
        >
          <UpcomingEvent />
        </Link>
      </FramePanel>
    </Frame>
  );
}
