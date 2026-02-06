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
            className="h-48 w-full object-cover sm:h-64 lg:h-72"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/70 via-black/20 to-transparent" />
          <Badge variant="brand" size="lg" className="absolute top-3 left-3">
            {event.type}
          </Badge>
        </div>

        {/* Event header */}
        <div className="from-brand/10 via-brand/5 to-background relative flex flex-col gap-3 bg-linear-to-br p-4 sm:p-5">
          <h1 className="text-xl leading-tight font-bold tracking-tight sm:text-2xl">
            {event.title}
          </h1>

          {/* Metadata row */}
          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="text-brand size-3.5 shrink-0" />
              <span>
                {event.startDatetime} &middot; {event.time} – {event.endTime}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <UsersIcon className="text-brand size-3.5 shrink-0" />
              <span>{event.attendees} attending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TicketIcon className="text-brand size-3.5 shrink-0" />
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

      <FrameFooter className="gap-2 px-4 py-3 sm:px-5">
        <Button className="gap-1.5">Attend Event</Button>
        <Button variant="outline" className="gap-1.5">
          <ExternalLinkIcon /> Website
        </Button>
      </FrameFooter>
    </Frame>
  );
}
