import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { useQuery } from "@tanstack/react-query";
import { recruitingQueries } from "../../api/queries";

export function SchoolStatsSidebar() {
  const { data } = useQuery(recruitingQueries.schoolSubmissions());

  if (!data) {
    return (
      <Frame compact>
        <FrameHeader>
          <FrameTitle>Stats</FrameTitle>
        </FrameHeader>
        <FramePanel>
          <div className="flex h-12 flex-col items-center justify-center">
            No submissions found
          </div>
        </FramePanel>
      </Frame>
    );
  }

  const total = data.length;
  const unwatched = data.filter((s) => !s.watched).length;
  const pending = data.filter((s) => s.status === "pending").length;
  const inReview = data.filter((s) => s.status === "in_review").length;
  const accepted = data.filter((s) => s.status === "accepted").length;
  const released = data.filter((s) => s.status === "released").length;

  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle>Stats</FrameTitle>
      </FrameHeader>
      <FramePanel>
        <div className="grid grid-cols-3 gap-2 p-3">
          <div className="bg-accent rounded-lg p-3 text-center">
            <p className="text-foreground text-2xl font-semibold">{total}</p>
            <p className="text-muted-foreground text-xs">Total</p>
          </div>
          <div className="bg-accent rounded-lg p-3 text-center">
            <p className="text-brand text-2xl font-semibold">{unwatched}</p>
            <p className="text-muted-foreground text-xs">Unwatched</p>
          </div>
          <div className="bg-accent rounded-lg p-3 text-center">
            <p className="text-muted-foreground text-2xl font-semibold">
              {pending}
            </p>
            <p className="text-muted-foreground text-xs">Pending</p>
          </div>
          <div className="bg-accent rounded-lg p-3 text-center">
            <p className="text-warning-foreground text-2xl font-semibold">
              {inReview}
            </p>
            <p className="text-muted-foreground text-xs">In Review</p>
          </div>
          <div className="bg-accent rounded-lg p-3 text-center">
            <p className="text-success-foreground text-2xl font-semibold">
              {accepted}
            </p>
            <p className="text-muted-foreground text-xs">Accepted</p>
          </div>
          <div className="bg-accent rounded-lg p-3 text-center">
            <p className="text-info-foreground text-2xl font-semibold">
              {released}
            </p>
            <p className="text-muted-foreground text-xs">Released</p>
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}
