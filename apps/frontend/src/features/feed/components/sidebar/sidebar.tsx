import { UpcomingEventsSkeleton } from "@/components/shared/upcoming-events-skeleton";
import { Suspense } from "react";
import { Fragment } from "react/jsx-runtime";
import { EventsSection } from "./sections/events-section";
import { ProgramsSection } from "./sections/programs-section";

export function FeedSidebar() {
  return (
    <Fragment>
      <Suspense fallback={<UpcomingEventsSkeleton />}>
        <EventsSection />
      </Suspense>
      <ProgramsSection />
    </Fragment>
  );
}
