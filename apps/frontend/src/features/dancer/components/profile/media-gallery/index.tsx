import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import type { DancerProfile } from "@/features/dancer/types";
import { ImagesSection } from "./images-section";
import { VideosSection } from "./videos-section";

interface MediaGalleryProps {
  images: DancerProfile["images"];
  videos: DancerProfile["videos"];
}

export function MediaGallery({ images, videos }: MediaGalleryProps) {
  const hasContent = images.length > 0 || videos.length > 0;

  return (
    <Frame className="h-fit w-full">
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Media Gallery
          <div className="h-7 w-fit sm:h-6" />
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        {hasContent ? (
          <div className="flex flex-col gap-4">
            {images.length > 0 && <ImagesSection images={images} />}

            {videos.length > 0 && <VideosSection videos={videos} />}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">No media uploaded</div>
        )}
      </FramePanel>
    </Frame>
  );
}
