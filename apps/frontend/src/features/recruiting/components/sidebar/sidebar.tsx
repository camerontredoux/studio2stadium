import { Fragment } from "react/jsx-runtime";
import { StatsSection } from "./sections/stats-section";
import { VideoSection } from "./sections/video-section";

export function RecruitingSidebar() {
  return (
    <Fragment>
      <VideoSection />
      <StatsSection />
    </Fragment>
  );
}
