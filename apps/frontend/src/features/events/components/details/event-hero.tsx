import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import {
  CalendarIcon,
  ExternalLinkIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react";
import type { EventDetail } from "../mock-data";

interface EventHeroProps {
  event: EventDetail;
}

export function EventHero({ event }: EventHeroProps) {
  return (
    <Frame compact>
      <FramePanel side="top">
        {/* Hero image */}
        <div className="relative border-b">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-48 sm:h-64 lg:h-72 object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/20 to-transparent pointer-events-none" />
          <Badge variant="brand" size="lg" className="absolute top-3 left-3">
            {event.tag}
          </Badge>
        </div>

        {/* Event header */}
        <div className="relative p-4 sm:p-5 flex flex-col gap-3 bg-linear-to-br from-brand/10 via-brand/5 to-background">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
            {event.title}
          </h1>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 shrink-0 text-brand" />
              <span>
                {event.date} &middot; {event.time} – {event.endTime}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <UsersIcon className="size-3.5 shrink-0 text-brand" />
              <span>{event.attendees} attending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TicketIcon className="size-3.5 shrink-0 text-brand" />
              <span>{event.price}</span>
            </div>
          </div>

          {/* Dance style badges */}
          <div className="flex flex-wrap gap-1.5">
            {event.danceStyles.map((style) => (
              <Badge key={style} variant="outline">
                {style}
              </Badge>
            ))}
          </div>
        </div>
      </FramePanel>

      <FrameFooter className="gap-2 px-4 sm:px-5 py-3">
        <Button className="gap-1.5">Attend Event</Button>
        <Button variant="outline" className="gap-1.5">
          <ExternalLinkIcon /> Website
        </Button>
      </FrameFooter>
    </Frame>
  );
}
