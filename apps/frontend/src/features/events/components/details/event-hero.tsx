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
import { useRouter } from "@tanstack/react-router";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ExternalLinkIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react";
import { SaveEventButton } from "./save-event";

type EventDetail = ApiSchemas["EventsIdResponse"];

interface EventHeroProps {
  event: EventDetail;
}

export function EventHero({ event }: EventHeroProps) {
  const router = useRouter();

  return (
    <Frame compact>
      <FramePanel side="top">
        <div className="relative isolate transform-gpu overflow-clip border-b">
          <img
            src={event.organizer.avatar || undefined}
            alt={event.title}
            className="h-48 w-full scale-105 rounded-2xl object-cover blur-sm sm:h-64"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/70 via-black/20 to-transparent" />

          <Button
            className="absolute top-3 left-3"
            size="xs"
            variant="ghost"
            onClick={() => router.history.back()}
          >
            <ChevronLeftIcon className="size-4" />
            Go back
          </Button>
          <Badge
            variant="brand"
            size="lg"
            className="absolute top-3 right-3 capitalize"
          >
            {event.type}
          </Badge>
        </div>

        <img
          src={event.organizer.avatar || undefined}
          alt={event.title}
          className="absolute top-31 left-4 z-20 size-20 rounded-xl bg-black object-cover shadow-xs sm:top-43 sm:size-24"
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
        </div>
      </FramePanel>

      <FrameFooter className="flex w-fit items-center gap-2 px-4 py-3 max-sm:w-full sm:px-5">
        <SaveEventButton size="sm" id={event.id} isSaved={event.saved} />
        {event.website && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5"
            render={<a target="_blank" href={event.website} />}
          >
            <ExternalLinkIcon /> Register
          </Button>
        )}
      </FrameFooter>
    </Frame>
  );
}
