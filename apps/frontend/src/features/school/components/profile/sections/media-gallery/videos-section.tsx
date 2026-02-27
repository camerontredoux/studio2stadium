import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SchoolProfile } from "@/features/school/types";
import { PlayIcon } from "lucide-react";

type Video = SchoolProfile["videos"][number];

export function VideosSection({ videos }: { videos: Video[] }) {
  return (
    <div>
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
        Videos ({videos.length})
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {videos.map((video) => (
          <Dialog key={video.id}>
            <DialogTrigger className="block w-full">
              <div className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg">
                <img
                  src={`https://img.youtube.com/vi/${video.mediaId}/hqdefault.jpg`}
                  alt={video.caption || "Video thumbnail"}
                  className="size-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-linear-to-t from-black/80 to-transparent">
                  <PlayIcon className="size-10 text-white transition-transform duration-150 group-hover:scale-125" />
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
        ))}
      </div>
    </div>
  );
}
