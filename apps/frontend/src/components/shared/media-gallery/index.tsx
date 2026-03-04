import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { useMemo } from "react";
import { ImageItem } from "./image/image-item";
import { MediaDialog } from "./media-dialog";
import type { Image, MediaItem, Video } from "./types";
import { VideoItem } from "./video-item";

interface MediaGalleryProps {
  images: Image[];
  videos: Video[];
  showOwnerControls: boolean;
}

export function MediaGallery({
  images,
  videos,
  showOwnerControls,
}: MediaGalleryProps) {
  const items = useMemo(() => {
    const all: MediaItem[] = [
      ...images.map((img) => ({ type: "image" as const, data: img })),
      ...videos.map((vid) => ({ type: "video" as const, data: vid })),
    ];
    return all.sort(
      (a, b) =>
        new Date(b.data.createdAt).getTime() -
        new Date(a.data.createdAt).getTime(),
    );
  }, [images, videos]);

  return (
    <Frame className="h-fit w-full">
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Media Gallery
          {showOwnerControls ? (
            <MediaDialog imageCount={images.length} videoCount={videos.length} />
          ) : (
            <div className="h-7 w-fit sm:h-6" />
          )}
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        {items.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((item) =>
              item.type === "image" ? (
                <ImageItem
                  showOwnerControls={showOwnerControls}
                  key={item.data.id}
                  image={item.data}
                />
              ) : (
                <VideoItem
                  showOwnerControls={showOwnerControls}
                  key={item.data.id}
                  video={item.data}
                />
              ),
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">No media uploaded</div>
        )}
      </FramePanel>
    </Frame>
  );
}
