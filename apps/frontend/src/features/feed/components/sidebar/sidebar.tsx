import { Fragment } from "react/jsx-runtime";
import { EventsSection } from "./sections/events-section";
import { ProgramsSection } from "./sections/programs-section";

export function FeedSidebar() {
  return (
    <Fragment>
      <EventsSection />
      <ProgramsSection />
      {/* <StatsSection /> */}
    </Fragment>
  );
}
