import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogPanel,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { PlayIcon } from "lucide-react";
import { useMemo } from "react";

interface Image {
  id: string;
  createdAt: string;
  mediaUrl: string;
  caption: string | null;
}

interface Video {
  id: string;
  createdAt: string;
  mediaId: string;
  caption: string | null;
}

type MediaItem =
  | { type: "image"; data: Image }
  | { type: "video"; data: Video };

interface MediaGalleryProps {
  images: Image[];
  videos: Video[];
}

export function MediaGallery({ images, videos }: MediaGalleryProps) {
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
          <div className="h-7 w-fit sm:h-6" />
        </FrameTitle>
      </FrameHeader>
      <FramePanel>
        {items.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {items.map((item) =>
              item.type === "image" ? (
                <ImageItem key={item.data.id} image={item.data} />
              ) : (
                <VideoItem key={item.data.id} video={item.data} />
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

function ImageItem({ image }: { image: Image }) {
  return (
    <Dialog>
      <DialogTrigger className="block w-full">
        <div className="bg-muted group relative aspect-square cursor-pointer overflow-hidden rounded-lg">
          <img
            src={image.mediaUrl}
            alt={image.caption || "Gallery image"}
            className="size-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl overflow-clip"
      >
        <DialogPanel className="h-full p-0">
          <img
            src={image.mediaUrl}
            alt={image.caption || "Gallery image"}
            className="absolute z-10 flex h-full w-full items-center justify-center object-contain"
          />
          <img
            src={image.mediaUrl}
            alt={image.caption || "Gallery image"}
            className="h-full w-full object-cover opacity-20 blur-md"
          />
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary">Close</Button>}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VideoItem({ video }: { video: Video }) {
  return (
    <Dialog>
      <DialogTrigger className="block w-full">
        <div className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg">
          <img
            src={`https://img.youtube.com/vi/${video.mediaId}/hqdefault.jpg`}
            alt={video.caption || "Video thumbnail"}
            className="size-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-linear-to-t from-black/80 to-transparent">
            <PlayIcon className="group-hover:text-brand size-10 text-white transition-all duration-150 group-hover:scale-105" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl overflow-clip"
      >
        <iframe
          src={`https://www.youtube.com/embed/${video.mediaId}`}
          title={video.caption || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video h-full w-full"
        />
        <DialogFooter>
          <DialogClose render={<Button variant="secondary">Close</Button>}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
