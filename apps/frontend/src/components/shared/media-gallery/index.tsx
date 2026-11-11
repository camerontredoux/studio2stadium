import { ReorderHint, SortableList } from "@/components/shared/sortable-list";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { useMemo } from "react";
import { ImageItem } from "./image/image-item";
import { MediaDialog } from "./media-dialog";
import { mediaKey, sortMedia } from "./sort";
import type { Image, MediaItem, Video } from "./types";
import { VideoItem } from "./video-item";

interface MediaGalleryProps {
  images: Image[];
  videos: Video[];
  showOwnerControls: boolean;
  orgAccountTier?: string | null;
  /** Open the owner's upload dialog on mount. */
  openUpload?: boolean;
  /** Lets the owner drag media into a new order; gets every item, in order. */
  onReorder?: (items: { type: MediaItem["type"]; id: string }[]) => void;
}

export function MediaGallery({
  images,
  videos,
  showOwnerControls,
  orgAccountTier,
  openUpload,
  onReorder,
}: MediaGalleryProps) {
  const items = useMemo(() => sortMedia(images, videos), [images, videos]);

  // Media without a playable file renders nothing; keep it out of the grid
  // but at the end of a saved order, which must list every item.
  const shown = items.filter(
    (item) => item.data.thumbnail && item.data.mediaUrl,
  );
  const hidden = items.filter((item) => !shown.includes(item));

  const reorder = onReorder
    ? (next: MediaItem[]) =>
        onReorder(
          [...next, ...hidden].map((item) => ({
            type: item.type,
            id: item.data.id,
          })),
        )
    : undefined;

  return (
    <Frame className="h-fit w-full">
      <FrameHeader>
        <FrameTitle className="flex items-center justify-between gap-2">
          Media Gallery
          {showOwnerControls ? (
            <MediaDialog
              imageCount={images.length}
              youtubeCount={videos.filter((v) => v.type === "youtube").length}
              orgAccountTier={orgAccountTier}
              defaultOpen={openUpload}
            />
          ) : (
            <div className="h-7 w-fit sm:h-6" />
          )}
        </FrameTitle>
        {onReorder ? (
          <ReorderHint items={shown.map((item) => item.data)}>
            Drag to change the gallery order
          </ReorderHint>
        ) : null}
      </FrameHeader>
      <FramePanel>
        {shown.length > 0 ? (
          <SortableList
            items={shown}
            getId={mediaKey}
            getLabel={(item) =>
              item.data.caption || (item.type === "image" ? "photo" : "video")
            }
            onReorder={reorder}
            layout="grid"
            className="grid grid-cols-3 gap-2 sm:grid-cols-4"
          >
            {(item, handle) => (
              <div className="relative">
                {item.type === "image" ? (
                  <ImageItem
                    showOwnerControls={showOwnerControls}
                    image={item.data}
                  />
                ) : (
                  <VideoItem
                    showOwnerControls={showOwnerControls}
                    video={item.data}
                  />
                )}
                {handle ? (
                  <div className="bg-background/90 absolute top-1.5 left-1.5 rounded-md shadow-sm backdrop-blur-sm">
                    {handle}
                  </div>
                ) : null}
              </div>
            )}
          </SortableList>
        ) : (
          <div className="text-muted-foreground text-sm">No media uploaded</div>
        )}
      </FramePanel>
    </Frame>
  );
}
