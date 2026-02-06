import { Button } from "@/components/ui/button";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { Link } from "@tanstack/react-router";
import { MOCK_VIDEO_URL } from "../../mock-data";

function extractYouTubeId(url: string) {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?#]+)/,
  );
  return match?.[1];
}

export function VideoSection() {
  const videoId = extractYouTubeId(MOCK_VIDEO_URL);

  if (!videoId) return null;

  return (
    <Frame compact>
      <FrameHeader>
        <FrameTitle className="flex items-center gap-2">
          Your Video
          <Button
            className="ml-auto"
            size="xs"
            render={<Link to="/recruiting/edit" />}
          >
            Edit
          </Button>
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Recruiting video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      </FramePanel>
    </Frame>
  );
}
