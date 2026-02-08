import { UpcomingEvent } from "@/components/shared/upcoming-event";
import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Separator } from "@/components/ui/separator";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { queries } from "../../api/queries";

export function MoreEvents() {
  const { eventId } = useParams({ from: "/_app/(routes)/events/$eventId" });
  const { data } = useSuspenseQuery(queries.events());

  const events = data
    .flatMap((group) => group.events)
    .filter((e) => e.id !== eventId)
    .slice(0, 3);

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
        {events.map((event, i) => (
          <div key={event.id}>
            {i > 0 && <Separator />}
            <Link
              to="/events/$eventId"
              params={{ eventId: event.id }}
              replace={true}
              preload="intent"
            >
              <UpcomingEvent event={event} />
            </Link>
          </div>
        ))}
      </FramePanel>
    </Frame>
  );
}
