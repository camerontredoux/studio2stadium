import { SuggestedProgramsSkeleton } from "@/components/shared/suggested-programs-skeleton";
import { UpcomingEventsSkeleton } from "@/components/shared/upcoming-events-skeleton";
import { Suspense } from "react";
import { Fragment } from "react/jsx-runtime";
import { ConsultationsSection } from "./sections/consultations-section";
import { EventsSection } from "./sections/events-section";
import { ProgramsSection } from "./sections/programs-section";

export function FeedSidebar({ type }: { type: "dancer" | "school" }) {
  return (
    <Fragment>
      <Suspense fallback={<UpcomingEventsSkeleton />}>
        <EventsSection />
      </Suspense>

      {type === "dancer" && (
        <Fragment>
          <Suspense fallback={<SuggestedProgramsSkeleton />}>
            <ProgramsSection />
          </Suspense>
          <ConsultationsSection />
        </Fragment>
      )}
    </Fragment>
  );
}
