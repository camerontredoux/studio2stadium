import { Suspense } from "react";
import { EventList } from "../components/events/event-list";
import { EventListSkeleton } from "../components/events/event-skeleton";

export function SchoolEventsPage() {
  return (
    <div className="flex flex-col gap-2 pt-1 sm:pt-0">
      <div className="mt-6 mb-2 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col max-sm:pl-1">
          <h1 className="text-2xl leading-none font-bold tracking-tight">
            School Events
          </h1>
          <p className="text-muted-foreground text-sm">
            Showcases, auditions & more from schools
          </p>
        </div>
      </div>

      <Suspense fallback={<EventListSkeleton />}>
        <EventList />
      </Suspense>
    </div>
  );
}
