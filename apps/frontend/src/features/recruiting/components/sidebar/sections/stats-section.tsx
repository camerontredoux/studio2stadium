import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { MOCK_SUBMISSIONS } from "../../mock-data";

export function StatsSection() {
  const accepted = MOCK_SUBMISSIONS.filter(
    (s) => s.prospectStatus === "accepted",
  ).length;
  const inReview = MOCK_SUBMISSIONS.filter(
    (s) => s.prospectStatus === "in-review",
  ).length;
  const watched = MOCK_SUBMISSIONS.filter(
    (s) => s.videoStatus === "watched",
  ).length;

  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle>Stats</FrameTitle>
      </FrameHeader>
      <FramePanel>
        <div className="grid grid-cols-3 gap-2 p-3">
          <div className="bg-accent rounded-lg p-3 text-center">
            <p className="text-success-foreground text-2xl font-semibold">
              {accepted}
            </p>
            <p className="text-muted-foreground text-xs">Accepted</p>
          </div>
          <div className="bg-accent rounded-lg p-3 text-center">
            <p className="text-warning-foreground text-2xl font-semibold">
              {inReview}
            </p>
            <p className="text-muted-foreground text-xs">In Review</p>
          </div>
          <div className="bg-accent rounded-lg p-3 text-center">
            <p className="text-info-foreground text-2xl font-semibold">
              {watched}
            </p>
            <p className="text-muted-foreground text-xs">Watched</p>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}
