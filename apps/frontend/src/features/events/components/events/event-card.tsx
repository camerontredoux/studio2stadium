import { ContentCard } from "@/components/shared/content-card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  BookmarkIcon,
  CalendarIcon,
  GraduationCapIcon,
  MapPinIcon,
} from "lucide-react";
import type { EventCard } from "../../types";

interface EventCardProps {
  event: EventCard["events"][number];
}

export function EventCard({ event }: EventCardProps) {
  return (
    <ContentCard
      image={event.organizer.thumbnail ?? ""}
      imageAlt={event.title}
      badge={event.type}
      title={event.title}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button
            variant="outline"
            size="xs"
            className="flex-1 sm:max-w-fit"
            render={
              <Link
                to="/events/$eventId"
                preload="intent"
                params={{ eventId: event.id }}
              />
            }
          >
            View Details
          </Button>
          {event.saved ? (
            <Button
              size="xs"
              variant="ghost"
              disabled
              className="flex-1 gap-1.5 sm:max-w-fit"
            >
              <BookmarkIcon className="fill-brand text-brand" /> Attending
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="text-muted-foreground flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="text-brand size-3.5 shrink-0" />
          <span className="truncate">
            {event.date} &middot; {event.time}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPinIcon className="text-brand size-3.5 shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <GraduationCapIcon className="text-brand size-3.5 shrink-0" />
          <span className="truncate">{event.organizer.name}</span>
        </div>
      </div>
    </ContentCard>
  );
}
