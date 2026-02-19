import { Suspense } from "react";
import { GlobalEventList } from "../components/global-events/global-event-list";
import { GlobalEventListSkeleton } from "../components/global-events/global-event-skeleton";

export function GlobalEventsPage() {
  return (
    <div className="flex flex-col gap-2 pt-1 sm:pt-0">
      <div className="mt-6 mb-2 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col max-sm:pl-1">
          <h1 className="text-2xl leading-none font-bold tracking-tight">
            Global Events
          </h1>
          <p className="text-muted-foreground text-sm">
            Events from organizations partnered with us
          </p>
        </div>
      </div>

      <Suspense fallback={<GlobalEventListSkeleton />}>
        <GlobalEventList />
      </Suspense>
    </div>
  );
}
