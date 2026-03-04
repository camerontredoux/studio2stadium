import { UpcomingEvent } from "@/components/shared/upcoming-event";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Separator } from "@/components/ui/separator";
import { eventQueries } from "@/features/events/api/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

export function UpcomingGlobalEventsSection() {
  const { data } = useSuspenseQuery(eventQueries.upcomingGlobalEvents());

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
        {data.slice(0, 3).map((event, i) => (
          <div key={event.id}>
            {i > 0 && <Separator />}
            <UpcomingEvent event={event} />
          </div>
        ))}
      </FramePanel>
    </Frame>
  );
}
