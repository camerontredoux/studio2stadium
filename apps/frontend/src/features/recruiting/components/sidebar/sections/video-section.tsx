import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { recruitingQueries } from "@/features/recruiting/api/queries";
import { useQuery } from "@tanstack/react-query";

export function VideoSection() {
  const { data } = useQuery(recruitingQueries.submission());

  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Your Video
          <Button size="xs" disabled={!data}>
            Edit
          </Button>
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        {data ? (
          <div className="flex flex-col">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${data.youtubeId}`}
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
