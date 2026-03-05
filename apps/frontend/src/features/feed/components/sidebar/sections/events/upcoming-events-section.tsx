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
import { useSubscribed } from "@/lib/session/hooks/use-subscribed";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

export function EventsSection() {
  const { data } = useSuspenseQuery(eventQueries.upcoming());
  const { data: subscription } = useSubscribed();

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
        {subscription.subscribed ? (
          data.map((event, i) => (
            <div key={event.id}>
              {i > 0 && <Separator />}
              <Link to="/events/$eventId" params={{ eventId: event.id }}>
                <UpcomingEvent event={event} />
              </Link>
            </div>
          ))
        ) : (
          <div className="text-muted-foreground flex items-center justify-center p-4 text-sm">
            This is a premium feature.
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
