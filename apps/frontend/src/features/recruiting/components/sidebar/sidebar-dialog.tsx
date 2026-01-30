import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Link } from "@tanstack/react-router";
import { BarChart3Icon } from "lucide-react";
import { MOCK_SUBMISSIONS, MOCK_VIDEO_URL } from "../mock-data";

function extractYouTubeId(url: string) {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/,
  );
  return match?.[1];
}

export function RecruitingSidebarDialog() {
  const videoId = extractYouTubeId(MOCK_VIDEO_URL);
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
    <Dialog>
      <DialogTrigger
        render={<Button size="sm" variant="outline" className="lg:hidden" />}
      >
        <BarChart3Icon /> Submission
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submission</DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <Frame compact>
            <FramePanel side="top">
              {videoId && (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="Recruiting video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              )}
            </FramePanel>
            <FrameFooter>
              <div className="grid w-full grid-cols-3 gap-2 py-3">
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
            </FrameFooter>
          </Frame>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Close</DialogClose>
          <Button render={<Link to="/recruiting/edit" />}>Edit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
