import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import { recruitingQueries } from "@/features/recruiting/api/queries";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

export function VideoSection() {
  const { data, isPending } = useQuery(recruitingQueries.submission());
  // The API answers 200 with no youtubeId when the dancer has no video.
  const youtubeId = data?.youtubeId;

  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Your Video
          <Button
            size="xs"
            disabled={!youtubeId}
            render={<Link to="/recruiting/edit" />}
          >
            Edit
          </Button>
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        {isPending ? (
          <Skeleton className="aspect-video rounded-none" />
        ) : youtubeId ? (
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
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center">
            No video submitted
          </div>
        )}
      </FramePanel>
    </Frame>
  );
}
