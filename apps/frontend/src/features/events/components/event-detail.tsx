import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Link } from "@tanstack/react-router";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ExternalLinkIcon,
  MapPinIcon,
  TicketIcon,
  TicketsIcon,
  UsersIcon,
} from "lucide-react";
import { getEventById } from "./mock-data";

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
      {/* Back link */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeftIcon className="size-4" />
        Back to Events
      </Link>

      {/* Hero + Header */}
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
                <TicketsIcon className="size-3.5 shrink-0 text-brand" />
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
          <Button className="gap-1.5">
            <TicketIcon /> Attend Event
          </Button>
          <Button variant="outline" className="gap-1.5">
            <ExternalLinkIcon /> Website
          </Button>
        </FrameFooter>
      </Frame>

      {/* Two-column detail grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-3 lg:gap-4">
          {/* About */}
          <Frame>
            <FramePanel>
              <FrameHeader>
                <FrameTitle>About</FrameTitle>
              </FrameHeader>
              <div className="px-5 pb-4">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              </div>
            </FramePanel>
          </Frame>

          {/* Schedule */}
          <Frame>
            <FramePanel>
              <FrameHeader>
                <FrameTitle>Schedule</FrameTitle>
              </FrameHeader>
              <div className="px-5 pb-4">
                <div className="relative flex flex-col gap-0">
                  {/* Timeline line */}
                  <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />

                  {event.schedule.map((item, i) => (
                    <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                      {/* Timeline dot */}
                      <div className="relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-brand bg-background" />

                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-brand">
                            {item.time}
                          </span>
                          <span className="text-sm font-medium">
                            {item.title}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FramePanel>
          </Frame>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3 lg:gap-4">
          {/* Organizer */}
          <Frame>
            <FrameHeader>
              <FrameTitle className="flex items-center gap-2">
                Organizer
                <Button
                  className="ml-auto"
                  size="xs"
                  variant="outline"
                  render={<Link to="/events" />}
                >
                  View Profile
                </Button>
              </FrameTitle>
            </FrameHeader>
            <FramePanel>
              <div className="flex items-center gap-3">
                <Avatar className="size-10 rounded-xl">
                  <AvatarImage src={event.organizer.avatar} />
                  <AvatarFallback>
                    {event.organizer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {event.organizer.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {event.organizer.role}
                  </span>
                </div>
              </div>
            </FramePanel>
          </Frame>

          {/* Location */}
          <Frame>
            <FrameHeader>
              <FrameTitle>Location</FrameTitle>
            </FrameHeader>
            <FramePanel>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="size-3.5 shrink-0 text-brand" />
                    <span className="text-sm font-medium">{event.venue}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">
                    {event.address}
                  </p>
                </div>
                {/* Map placeholder */}
                <div className="rounded-lg border bg-muted/50 h-32 flex items-center justify-center text-xs text-muted-foreground">
                  Map coming soon
                </div>
              </div>
            </FramePanel>
          </Frame>
        </div>
      </div>
    </div>
  );
}
