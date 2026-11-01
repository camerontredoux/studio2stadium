import {
  DownloadSimpleIcon,
  PencilSimpleIcon,
  PlayIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { Icon } from "@/components/event/icon";
import type {
  EventVideo,
  VideoCategory,
} from "@/features/org/api/video-queries";

interface EventVideoCardProps {
  video: EventVideo;
  category?: VideoCategory;
  onEdit?: (video: EventVideo) => void;
  onDelete?: (video: EventVideo) => void;
}

/** Downloads the video's music track. */
function DownloadMusic({ video }: { video: EventVideo }) {
  if (!video.audioUrl) return null;
  return (
    <Button
      iconOnly
      variant="ghost"
      label="Download music"
      render={
        <a
          href={video.audioUrl}
          download={video.audioFilename ?? "audio.mp3"}
        />
      }
    >
      <Icon icon={DownloadSimpleIcon} />
    </Button>
  );
}

/**
 * A video thumbnail with its title and category; the thumbnail plays it in a
 * dialog. Edit and delete buttons show when their handlers are given.
 */
export function EventVideoCard({
  video,
  category,
  onEdit,
  onDelete,
}: EventVideoCardProps) {
  const [open, setOpen] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}`;

  return (
    <>
      <div className="flex min-w-0 flex-col gap-(--space-8) [content-visibility:auto]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Play ${video.title}`}
          className="border-line hover:border-line-hover bg-surface-chip s2s-focus relative grid aspect-video w-full cursor-pointer place-items-center overflow-hidden rounded-(--radius-8) border p-0 transition-[border-color] duration-150"
        >
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
          <Icon
            icon={PlayIcon}
            size={22}
            className="text-fg-media relative drop-shadow"
          />
        </button>

        <div className="flex min-w-0 items-start gap-(--space-4)">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-fg line-clamp-2 text-[13px] leading-[1.4] font-medium">
              {video.title}
            </span>
            {category && (
              <span className="text-fg-3 truncate font-mono text-[11.5px] leading-[1.4]">
                {category.name}
              </span>
            )}
          </span>
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              label={`Edit ${video.title}`}
              onClick={() => onEdit(video)}
            >
              <Icon icon={PencilSimpleIcon} />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              label={`Delete ${video.title}`}
              onClick={() => onDelete(video)}
            >
              <Icon icon={TrashIcon} />
            </Button>
          )}
        </div>

        {video.audioUrl && (
          <div className="flex items-center gap-(--space-8)">
            <audio
              controls
              src={video.audioUrl}
              preload="none"
              className="h-8 min-w-0 flex-1"
            />
            <DownloadMusic video={video} />
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup className="max-w-[880px]">
          <div className="aspect-video w-full shrink-0 bg-black">
            <iframe
              src={embedUrl}
              title={video.title}
              className="size-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <DialogFooter className="justify-between">
            <span className="flex min-w-0 flex-col">
              <DialogTitle className="truncate">{video.title}</DialogTitle>
              {category && (
                <span className="text-fg-3 truncate font-mono text-[11.5px] leading-[1.4]">
                  {category.name}
                </span>
              )}
            </span>
            <DialogClose render={<Button variant="ghost" size="lg" />}>
              Close
            </DialogClose>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
