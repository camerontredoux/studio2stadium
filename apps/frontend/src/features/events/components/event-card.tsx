import { ContentCard } from "@/components/shared/content-card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { CalendarIcon, MapPinIcon, TicketIcon, UsersIcon } from "lucide-react";
import type { Event } from "./mock-data";

export type { Event };

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <ContentCard
      image={event.image}
      imageAlt={event.title}
      badge={event.tag}
      title={event.title}
      footer={
        <>
          <Button size="xs" className="gap-1.5">
            <TicketIcon /> Attend
          </Button>
          <Button
            variant="outline"
            size="xs"
            render={
              <Link to="/events/$eventId" params={{ eventId: event.id }} />
            }
          >
            View Details
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1 text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="size-3.5 shrink-0 text-brand" />
          <span>
            {event.date} &middot; {event.time}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPinIcon className="size-3.5 shrink-0 text-brand" />
          <span className="truncate">{event.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <UsersIcon className="size-3.5 shrink-0 text-brand" />
          <span>
            {event.attendees} attendee{event.attendees !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </ContentCard>
  );
}
