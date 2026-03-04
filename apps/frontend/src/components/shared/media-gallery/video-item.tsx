import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogPanel,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VideoIcon } from "lucide-react";
import type { Video } from "./types";
import { VideoDelete } from "./video-delete";

export function VideoItem({
  video,
  showOwnerControls,
}: {
  video: Video;
  showOwnerControls: boolean;
}) {
  if (!video.thumbnail || !video.mediaUrl) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger className="block w-full">
        <div className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg">
          <img
            src={video.thumbnail}
            alt={video.caption || "Video thumbnail"}
            className="size-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-linear-to-t from-black/80 to-transparent">
            <VideoIcon className="group-hover:text-brand size-8 text-white transition-all duration-150" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-7xl overflow-clip"
      >
        <DialogPanel className="p-0" scrollFade={false}>
          <iframe
            src={video.mediaUrl}
            title={video.caption || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full"
          />
        </DialogPanel>
        <DialogFooter>
          {showOwnerControls ? (
            <VideoDelete key={video.id} id={video.id} />
          ) : null}
          <DialogClose render={<Button variant="secondary">Close</Button>}>
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
