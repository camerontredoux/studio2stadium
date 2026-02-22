import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { useQuery } from "@tanstack/react-query";
import { recruitingQueries } from "../../../api/queries";

export function StatsSection() {
  const { data } = useQuery(recruitingQueries.submissions());

  if (!data) {
    return (
      <Frame compact>
        <FrameHeader>
          <FrameTitle>Stats</FrameTitle>
        </FrameHeader>
        <FramePanel>
          <div className="flex h-12 flex-col items-center justify-center">
            No submission found
          </div>
        </FramePanel>
      </Frame>
    );
  }

  const accepted = data.filter((s) => s.status === "accepted").length;
  const inReview = data.filter((s) => s.status === "in_review").length;
  const watched = data.filter((s) => s.watched).length;

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
