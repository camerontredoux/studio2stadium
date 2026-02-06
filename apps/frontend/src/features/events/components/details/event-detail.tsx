import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarIcon, ChevronLeftIcon } from "lucide-react";
import { queries } from "../../api/queries";
import { EventAbout } from "./event-about";
import { EventHero } from "./event-hero";
import { EventLocation } from "./event-location";
import { EventOrganizer } from "./event-organizer";
import { EventSchedule } from "./event-schedule";

interface EventDetailProps {
  eventId: string;
}

export function EventDetail({ eventId }: EventDetailProps) {
  const { data: event } = useSuspenseQuery(queries.event(eventId));

  if (!event) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Event not found</EmptyTitle>
          <EmptyDescription>
            The event you're looking for doesn't exist or has been removed.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <EmptyMedia variant="icon">
            <CalendarIcon className="size-10" />
          </EmptyMedia>
          <Button render={<Link to="/events" />}>Back to Events</Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3 pt-1 max-lg:pb-14 lg:gap-4 lg:pt-0">
      <Link
        to="/events"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 text-sm transition-colors"
      >
        <ChevronLeftIcon className="size-4" />
        Back to Events
      </Link>

      <EventHero event={event} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="flex flex-col gap-3 lg:col-span-2 lg:gap-4">
          <EventAbout description={event.description} />
          <EventSchedule schedule={event.schedule} />
        </div>

        <div className="flex flex-col gap-3 lg:gap-4">
          <EventOrganizer organizer={event.organizer} />
          <EventLocation venue={event.location} address={event.address} />
        </div>
      </div>
    </div>
  );
}
