import { SidebarLayout } from "@/components/layouts/sidebar-layout";
import { UpcomingEventsSkeleton } from "@/components/shared/upcoming-events-skeleton";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { CalendarIcon, ChevronLeftIcon } from "lucide-react";
import { Suspense } from "react";
import { eventQueries } from "../../api/queries";
import { EventAbout } from "./event-about";
import { EventHero } from "./event-hero";
import { EventLocation } from "./event-location";
import { EventOrganizer } from "./event-organizer";
import { EventSchedule } from "./event-schedule";
import { MoreEvents } from "./more-events";

interface EventDetailProps {
  eventId: string;
}

export function EventDetail({ eventId }: EventDetailProps) {
  const router = useRouter();

  const { data: event, error } = useSuspenseQuery(eventQueries.event(eventId));

  if (error?.errors) {
    return error.errors.map((err) => <div>{err.message}</div>);
  }

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
    <SidebarLayout
      sidebar={
        <>
          <EventOrganizer organizer={event.organizer} />
          <EventLocation venue={event.location} address={event.address} />
        </>
      }
      tabs={{ contentLabel: "Event", sidebarLabel: "Details" }}
    >
      <div className="mobile:pb-14 flex flex-col gap-3 lg:gap-4">
        <button
          className="text-muted-foreground hover:text-foreground inline-flex w-fit cursor-pointer items-center gap-1 text-sm transition-colors"
          onClick={() => router.history.back()}
        >
          <ChevronLeftIcon className="size-4" />
          Go back
        </button>
        <div className="flex flex-col gap-3 lg:gap-4">
          <EventHero event={event} />
          <EventAbout description={event.description} />
          <EventSchedule schedule={event.schedule} />

          <Separator className="my-2" />

          <Suspense fallback={<UpcomingEventsSkeleton />}>
            <MoreEvents />
          </Suspense>
        </div>
      </div>
    </SidebarLayout>
  );
}
