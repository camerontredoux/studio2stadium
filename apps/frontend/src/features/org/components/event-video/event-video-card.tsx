import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Frame, FramePanel } from "@/components/ui/frame";
import { DownloadIcon, PencilIcon, Trash2Icon, VideoIcon, XIcon } from "lucide-react";
import { useState } from "react";
import type { EventVideo, VideoCategory } from "@/features/org/api/video-queries";

interface EventVideoCardProps {
  video: EventVideo;
  category?: VideoCategory;
  onEdit?: (video: EventVideo) => void;
  onDelete?: (video: EventVideo) => void;
}

export function EventVideoCard({ video, category, onEdit, onDelete }: EventVideoCardProps) {
  const [open, setOpen] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}`;
  const isAdmin = !!(onEdit || onDelete);

  return (
    <>
      <Frame compact className="group flex flex-col [content-visibility:auto]">
        <FramePanel side="inset" className="flex flex-col">
          <button
            type="button"
            className="relative aspect-video w-full cursor-pointer overflow-hidden"
            onClick={() => setOpen(true)}
          >
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                <VideoIcon className="size-5 text-white" />
              </div>
            </div>
            {category && (
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 bg-black/50 text-[10px] text-white backdrop-blur-sm"
              >
                {category.name}
              </Badge>
            )}
          </button>

          <div className="relative flex items-start gap-2 px-3 py-2.5">
            <span className="line-clamp-2 min-w-0 flex-1 text-sm font-medium">
              {video.title}
            </span>
            {isAdmin && (
              <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => { e.stopPropagation(); onEdit(video); }}
                  >
                    <PencilIcon className="size-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={(e) => { e.stopPropagation(); onDelete(video); }}
                  >
                    <Trash2Icon className="size-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
          {video.audioUrl && (
            <div className="flex items-center gap-2 border-t px-3 py-2">
              <audio
                controls
                src={video.audioUrl}
                preload="none"
                className="h-8 min-w-0 flex-1"
              />
              <a
                href={video.audioUrl}
                download={video.audioFilename ?? "audio.mp3"}
                className="inline-flex shrink-0 items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <DownloadIcon className="size-4" />
              </a>
            </div>
          )}
        </FramePanel>
      </Frame>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <div className="aspect-video min-h-0 w-full flex-1">
            <iframe
              src={embedUrl}
              title={video.title}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <DialogFooter className="px-4 pb-4">
            <span className="mr-auto text-sm font-medium">{video.title}</span>
            <DialogClose render={<Button variant="outline" size="sm" />}>
              <XIcon className="mr-1 size-3" />
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
