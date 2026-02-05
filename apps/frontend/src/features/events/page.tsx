import { Suspense } from "react";
import { EventList } from "./components/events/event-list";
import { EventListSkeleton } from "./components/events/event-skeleton";

export function Page() {
  return (
    <div className="flex pt-1 sm:pt-0 flex-col gap-2 lg:gap-4 max-lg:pb-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex flex-col max-sm:pl-1">
          <h1 className="text-2xl font-bold tracking-tight leading-none">
            Events
          </h1>
          <p className="text-sm text-muted-foreground">
            Showcases, auditions, workshops & more
          </p>
        </div>
      </div>

      <Suspense fallback={<EventListSkeleton />}>
        <EventList />
      </Suspense>
    </div>
  );
}
