import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Link } from "@tanstack/react-router";
import { CalendarIcon, ChevronLeftIcon } from "lucide-react";
import { getEventById } from "../mock-data";
import { EventAbout } from "./event-about";
import { EventHero } from "./event-hero";
import { EventLocation } from "./event-location";
import { EventOrganizer } from "./event-organizer";
import { EventSchedule } from "./event-schedule";

interface EventDetailProps {
  eventId: string;
}

export function EventDetail({ eventId }: EventDetailProps) {
  const event = getEventById(eventId);

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
    <div className="flex flex-col gap-3 lg:gap-4 max-lg:pb-14">
      <Link
        to="/events"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeftIcon className="size-4" />
        Back to Events
      </Link>

      <EventHero event={event} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        <div className="lg:col-span-2 flex flex-col gap-3 lg:gap-4">
          <EventAbout description={event.description} />
          <EventSchedule schedule={event.schedule} />
        </div>

        <div className="flex flex-col gap-3 lg:gap-4">
          <EventOrganizer organizer={event.organizer} />
          <EventLocation venue={event.venue} address={event.address} />
        </div>
      </div>
    </div>
  );
}
