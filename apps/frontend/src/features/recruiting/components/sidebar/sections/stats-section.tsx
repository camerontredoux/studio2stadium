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
          <div className="rounded-lg bg-accent p-3 text-center">
            <p className="text-2xl font-semibold text-success-foreground">
              {accepted}
            </p>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </div>
          <div className="rounded-lg bg-accent p-3 text-center">
            <p className="text-2xl font-semibold text-warning-foreground">
              {inReview}
            </p>
            <p className="text-xs text-muted-foreground">In Review</p>
          </div>
          <div className="rounded-lg bg-accent p-3 text-center">
            <p className="text-2xl font-semibold text-info-foreground">
              {watched}
            </p>
            <p className="text-xs text-muted-foreground">Watched</p>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}
