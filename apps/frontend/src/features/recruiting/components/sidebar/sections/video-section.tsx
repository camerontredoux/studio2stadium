import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { getYouTubeId } from "@/utils/get-youtube-id";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { VideoIcon } from "lucide-react";
import { recruitingQueries } from "../../../api/queries";

export function VideoSection() {
  const { data } = useSuspenseQuery(recruitingQueries.submissions());
  const videoId = data?.videoId;
  const submissions = data?.submissions ?? [];

  const youtubeId = videoId ? getYouTubeId(videoId) : null;
  const hasVideo = !!youtubeId;

  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Your Video
          {hasVideo && (
            <Button
              className="ml-auto"
              size="xs"
              render={<Link to="/recruiting/submit" />}
            >
              New Submission
            </Button>
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        {hasVideo ? (
          <div className="flex flex-col">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="Recruiting video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            {submissions.length > 0 && (
              <p className="text-muted-foreground p-3 text-center text-sm">
                Submitted to {submissions.length} school
                {submissions.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <div className="bg-muted/50 rounded-lg p-3">
              <VideoIcon className="text-muted-foreground size-6" />
            </div>
            <p className="text-muted-foreground text-sm">
              No video submitted yet
            </p>
            <Button size="sm" render={<Link to="/recruiting/submit" />}>
              Submit Video
            </Button>
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
