import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ApiSchemas } from "@/lib/api/client";
import {
  CalendarIcon,
  ExternalLinkIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react";
// import type { EventDetail } from "../mock-data";

type EventDetail = ApiSchemas["EventsIdResponse"];

interface EventHeroProps {
  event: EventDetail;
}

export function EventHero({ event }: EventHeroProps) {
  return (
    <Frame compact>
      <FramePanel side="top">
        <div className="relative overflow-clip border-b">
          <img
            src={event.organizer.avatar || undefined}
            alt={event.title}
            className="h-48 w-full object-cover blur-md sm:h-64"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/70 via-black/20 to-transparent" />
          <Badge
            variant="brand"
            size="lg"
            className="absolute top-3 left-3 capitalize"
          >
            {event.type}
          </Badge>
        </div>

        <img
          src={event.organizer.avatar || undefined}
          alt={event.title}
          className="absolute top-31 left-4 z-20 size-20 rounded-xl border bg-black object-cover sm:top-43 sm:size-24"
        />

        <div className="from-brand/10 via-brand/5 to-background relative flex flex-col gap-1 bg-linear-to-br p-4">
          <h1 className="text-xl leading-tight font-bold tracking-tight sm:text-2xl">
            {event.title}
          </h1>

          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="text-brand size-3.5 shrink-0" />
              <span>
                {event.startDate} &middot; {event.startTime} - {event.endDate}{" "}
                &middot; {event.endTime}
              </span>
            </div>
            <TooltipProvider delay={0}>
              <Tooltip>
                <TooltipTrigger className="cursor-help">
                  <div className="flex items-center gap-1.5">
                    <UsersIcon className="text-brand size-3.5 shrink-0" />
                    <span className="decoration-muted-foreground desktop:underline decoration-dashed underline-offset-4">
                      {event.attendees} attending
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {event.attendees} other users saved this event
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center gap-1.5">
              <TicketIcon className="text-brand size-3.5 shrink-0" />
              <span>{event.cost || "Free"}</span>
            </div>
          </div>

          {/* <div className="flex flex-wrap gap-1.5">
            {event.danceStyles.map((style) => (
              <Badge key={style} variant="outline">
                {style}
              </Badge>
            ))}
          </div> */}
        </div>
      </FramePanel>

      <FrameFooter className="gap-2 px-4 py-3 sm:px-5">
        <Button className="gap-1.5">Save Event</Button>
        {event.website && (
          <Button
            variant="outline"
            className="gap-1.5"
            render={<a target="_blank" href={event.website} />}
          >
            <ExternalLinkIcon /> Register
          </Button>
        )}
      </FrameFooter>
    </Frame>
  );
}
