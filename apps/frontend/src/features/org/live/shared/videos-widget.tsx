import {
  DownloadSimpleIcon,
  PlayCircleIcon,
  PlayIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { Icon } from "@/components/event/icon";
import { Widget } from "@/components/event/shell";
import { cn } from "@/components/utils/cn";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import {
  type EventVideo,
  videoQueries,
} from "@/features/org/api/video-queries";
import { AddEditVideoDialog } from "@/features/org/components/event-video/add-edit-video-dialog";
import { useOrg } from "@/features/org/context/use-org";

type VideosWidgetProps = {
  event: OrgEvent;
  /** Admins get an Upload button that opens the add-video dialog. */
  canUpload?: boolean;
  /** Must be in the surrounding `WidgetBoard`'s `order`. Default "videos". */
  id?: string;
};

function thumbnailUrl(video: EventVideo) {
  return `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
}

function Thumbnail({
  video,
  iconSize,
  className,
}: {
  video: EventVideo | undefined;
  iconSize: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "bg-surface-chip text-fg-2 relative grid place-items-center overflow-hidden",
        className,
      )}
    >
      {video && (
        <img
          src={thumbnailUrl(video)}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <Icon
        icon={PlayIcon}
        size={iconSize}
        className={video ? "text-fg-media relative drop-shadow" : "text-fg-3"}
      />
    </span>
  );
}

/**
 * The event's video library: a 2×2 thumbnail peek, then a grid of 16:9 cards that
 * play the video in a dialog. Hidden when the org doesn't have the video library.
 */
function VideosWidget({
  event,
  canUpload = false,
  id = "videos",
}: VideosWidgetProps) {
  const { org, hasFeature } = useOrg();
  const enabled = hasFeature("video_library");
  const slug = org.slug;

  const { data: videos = [] } = useQuery({
    ...videoQueries.videos(slug, event.id),
    enabled: enabled && !!event.id,
  });
  const { data: categories = [] } = useQuery({
    ...videoQueries.categories(slug, event.id),
    enabled: enabled && !!event.id,
  });

  const [playing, setPlaying] = useState<EventVideo | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Same order as the video library page: by category, then by each video's position.
  const sorted = useMemo(() => {
    const categoryOrder = new Map(
      categories.map((category) => [category.id, category.sortOrder]),
    );
    return [...videos].sort(
      (a, b) =>
        (categoryOrder.get(a.categoryId) ?? 0) -
          (categoryOrder.get(b.categoryId) ?? 0) || a.sortOrder - b.sortOrder,
    );
  }, [videos, categories]);

  const categoryName = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  if (!enabled) {
    return (
      <Widget
        id={id}
        label="Videos"
        icon={PlayCircleIcon}
        disabled
        disabledText="Not included in this event"
      />
    );
  }

  const count = videos.length;
  const peekVideos = [0, 1, 2, 3].map((index) => sorted[index]);

  return (
    <>
      <Widget
        id={id}
        label="Videos"
        icon={PlayCircleIcon}
        count={count}
        peek={
          <>
            <span className="bp-phone:grid-cols-4 bp-phone:grid-rows-1 grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-1">
              {peekVideos.map((video, index) => (
                <Thumbnail
                  key={video?.id ?? index}
                  video={video}
                  iconSize={14}
                  className="rounded-(--radius-4)"
                />
              ))}
            </span>
            <span className="flex items-baseline gap-(--space-6)">
              <span className="text-fg font-mono text-[13px] tabular-nums">
                {count}
              </span>
              <span className="text-fg-3 text-[12.5px]">
                {count === 1 ? "video" : "videos"}
              </span>
            </span>
          </>
        }
        actions={
          canUpload && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Icon icon={UploadSimpleIcon} />
              Upload
            </Button>
          )
        }
        // Admins only: the library page manages categories and order.
        fullPage={
          canUpload ? (
            <Link
              to="/o/$orgSlug/admin/video-library"
              params={{ orgSlug: slug }}
            />
          ) : undefined
        }
      >
        {count === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-(--space-10) p-(--space-16) text-center">
            <Icon icon={PlayCircleIcon} size="xl" className="text-fg-3" />
            <p className="type-body text-fg-2 m-0">No videos yet</p>
          </div>
        ) : (
          <div className="p-(--space-14)">
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] gap-(--space-14) p-0">
              {sorted.map((video) => (
                <li
                  key={video.id}
                  className="flex min-w-0 flex-col gap-(--space-8)"
                >
                  <button
                    type="button"
                    aria-label={`Play ${video.title}`}
                    className="group s2s-focus w-full cursor-pointer rounded-(--radius-8) border-0 bg-transparent p-0"
                    onClick={() => setPlaying(video)}
                  >
                    <Thumbnail
                      video={video}
                      iconSize={22}
                      className="border-line group-hover:border-line-hover aspect-video w-full rounded-(--radius-8) border transition-[border-color] duration-150"
                    />
                  </button>
                  {video.audioUrl && (
                    <audio
                      controls
                      src={video.audioUrl}
                      preload="none"
                      className="h-8 w-full"
                    />
                  )}
                  <span className="text-fg flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[13px] leading-[1.4] font-medium">
                      {video.title}
                    </span>
                    <span className="text-fg-3 truncate font-mono text-[11.5px] leading-[1.4]">
                      {categoryName.get(video.categoryId) ?? "[Category]"}
                      {video.audioUrl ? " · Music" : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Widget>

      <Dialog
        open={playing !== null}
        onOpenChange={(open) => {
          if (!open) setPlaying(null);
        }}
      >
        <DialogPopup className="max-w-[880px]">
          {playing && (
            <>
              <div className="aspect-video w-full shrink-0 bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${playing.youtubeId}`}
                  title={playing.title}
                  className="size-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {playing.audioUrl && (
                <div className="border-line flex items-center gap-(--space-8) border-t px-(--space-16) py-(--space-10)">
                  <audio
                    controls
                    src={playing.audioUrl}
                    preload="none"
                    className="h-8 min-w-0 flex-1"
                  />
                  <Button
                    iconOnly
                    variant="ghost"
                    label="Download music"
                    render={
                      <a
                        href={playing.audioUrl}
                        download={playing.audioFilename ?? "audio.mp3"}
                      />
                    }
                  >
                    <Icon icon={DownloadSimpleIcon} />
                  </Button>
                </div>
              )}
              <DialogFooter className="justify-between">
                <span className="flex min-w-0 flex-col">
                  <DialogTitle className="truncate">
                    {playing.title}
                  </DialogTitle>
                  <span className="text-fg-3 truncate font-mono text-[11.5px] leading-[1.4]">
                    {categoryName.get(playing.categoryId) ?? "[Category]"}
                  </span>
                </span>
                <DialogClose render={<Button variant="ghost" size="lg" />}>
                  Close
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogPopup>
      </Dialog>

      {canUpload && (
        <AddEditVideoDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          categories={categories}
          slug={slug}
          eventId={event.id}
          editingVideo={null}
        />
      )}
    </>
  );
}

export { VideosWidget };
export type { VideosWidgetProps };
