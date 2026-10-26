import {
  DownloadSimpleIcon,
  FolderSimpleIcon,
  PencilSimpleIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";

import { Button } from "@/components/event/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { Icon } from "@/components/event/icon";
import {
  Panel,
  PanelHead,
  PanelSubHead,
  PanelToolbar,
} from "@/components/event/panel";
import { Search } from "@/components/event/search";
import { Select } from "@/components/event/select";
import {
  type EventVideo,
  useDeleteVideo,
  videoQueries,
} from "@/features/org/api/video-queries";
import { AddEditVideoDialog } from "@/features/org/components/event-video/add-edit-video-dialog";
import { ManageCategoriesDialog } from "@/features/org/components/event-video/manage-categories-dialog";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { ConfirmDialog } from "@/features/org/live/shared/confirm-dialog";
import { SubpageHeader } from "@/features/org/live/shared/event-header";
import { ShellPage } from "@/features/org/live/shared/shell-slots";

function thumbnailUrl(video: EventVideo) {
  return `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
}

/**
 * /admin/video-library: the event's videos by category, with search, a category
 * filter, "Categories" (the manage dialog) and "Add video". A card plays the video;
 * its pencil and trash edit or delete it.
 */
export function VideoLibraryPage({ orgSlug }: { orgSlug: string }) {
  const { selectedEvent } = useAdminEvent();
  const eventId = selectedEvent?.id ?? "";

  const { data: categories = [], isPending: categoriesPending } = useQuery({
    ...videoQueries.categories(orgSlug, eventId),
    enabled: !!eventId,
  });
  const { data: videos = [], isPending: videosPending } = useQuery({
    ...videoQueries.videos(orgSlug, eventId),
    enabled: !!eventId,
  });

  const [search, setSearch] = useState("");
  const query = useDeferredValue(search).trim().toLowerCase();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<EventVideo | null>(null);
  const [deleting, setDeleting] = useState<EventVideo | null>(null);
  const [playing, setPlaying] = useState<EventVideo | null>(null);
  const deleteVideo = useDeleteVideo(orgSlug, eventId);

  const videoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of videos)
      counts[v.categoryId] = (counts[v.categoryId] ?? 0) + 1;
    return counts;
  }, [videos]);

  const groups = useMemo(
    () =>
      [...categories]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .filter((category) => !categoryFilter || category.id === categoryFilter)
        .map((category) => ({
          category,
          videos: videos
            .filter(
              (v) =>
                v.categoryId === category.id &&
                (!query || v.title.toLowerCase().includes(query)),
            )
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }))
        .filter((group) => group.videos.length > 0),
    [categories, videos, categoryFilter, query],
  );

  const header = (
    <SubpageHeader
      event={selectedEvent ?? null}
      title="Video library"
      dashboardTo="/o/$orgSlug/admin"
      showStatus
      actions={
        selectedEvent && (
          <>
            <Button onClick={() => setManageOpen(true)}>
              <Icon icon={FolderSimpleIcon} />
              Categories
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              <Icon icon={PlusIcon} />
              Add video
            </Button>
          </>
        )
      }
    />
  );

  if (!selectedEvent) {
    return (
      <ShellPage header={header}>
        <Panel>
          <Empty>No event selected. Create an event to manage videos.</Empty>
        </Panel>
      </ShellPage>
    );
  }

  const loading = categoriesPending || videosPending;
  const filtering = !!query || !!categoryFilter;

  return (
    <ShellPage header={header}>
      <Panel aria-label="Videos">
        <PanelHead label="Videos" count={loading ? undefined : videos.length} />
        <PanelToolbar>
          {categories.length > 0 && (
            <Select
              label="Filter by category"
              className="max-w-[200px] min-w-0"
              value={categoryFilter ?? "all"}
              onChange={(value) =>
                setCategoryFilter(!value || value === "all" ? null : value)
              }
              options={[
                { value: "all", label: "All categories" },
                ...[...categories]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((c) => ({
                    value: c.id,
                    label: `${c.name} (${videoCounts[c.id] ?? 0})`,
                  })),
              ]}
            />
          )}
          <Search
            placeholder="Search"
            aria-label="Search videos"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </PanelToolbar>

        {loading ? (
          <Empty>Loading videos…</Empty>
        ) : groups.length === 0 ? (
          <Empty>
            {filtering
              ? "No videos match."
              : categories.length === 0
                ? "No categories yet. Add a category, then add videos to it."
                : "No videos yet. Add a YouTube link to share it with dancers."}
          </Empty>
        ) : (
          groups.map(({ category, videos: list }) => (
            <section
              key={category.id}
              aria-label={category.name}
              // The toolbar rules off the first group; the rest need their own line above.
              className="border-line not-first-of-type:border-t"
            >
              <PanelSubHead label={category.name}>
                <span className="type-data-sm text-fg-3">{list.length}</span>
              </PanelSubHead>
              <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-(--space-14) p-(--space-14)">
                {list.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    category={category.name}
                    onPlay={() => setPlaying(video)}
                    onEdit={() => {
                      setEditing(video);
                      setEditorOpen(true);
                    }}
                    onDelete={() => setDeleting(video)}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </Panel>

      <ManageCategoriesDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        categories={categories}
        videoCounts={videoCounts}
        slug={orgSlug}
        eventId={eventId}
      />
      <AddEditVideoDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        categories={categories}
        slug={orgSlug}
        eventId={eventId}
        editingVideo={editing}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete video?"
        description={`"${deleting?.title ?? ""}" is removed from the library for dancers and coaches. This can't be undone.`}
        confirmLabel="Delete"
        pending={deleteVideo.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteVideo.mutate(
            {
              params: {
                path: { slug: orgSlug, id: eventId, videoId: deleting.id },
              },
            },
            { onSettled: () => setDeleting(null) },
          );
        }}
      />
      <PlayDialog
        video={playing}
        category={
          categories.find((c) => c.id === playing?.categoryId)?.name ?? ""
        }
        onClose={() => setPlaying(null)}
      />
    </ShellPage>
  );
}

function VideoCard({
  video,
  category,
  onPlay,
  onEdit,
  onDelete,
}: {
  video: EventVideo;
  category: string;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="group flex min-w-0 flex-col gap-(--space-8)">
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${video.title}`}
        className="border-line hover:border-line-hover bg-surface-chip s2s-focus relative grid aspect-video w-full cursor-pointer place-items-center overflow-hidden rounded-(--radius-8) border p-0 transition-[border-color] duration-150"
      >
        <img
          src={thumbnailUrl(video)}
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
          <span className="text-fg-3 truncate font-mono text-[11.5px] leading-[1.4]">
            {category}
            {video.audioUrl ? " · Music" : ""}
          </span>
        </span>
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          label={`Edit ${video.title}`}
          onClick={onEdit}
        >
          <Icon icon={PencilSimpleIcon} />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          label={`Delete ${video.title}`}
          onClick={onDelete}
        >
          <Icon icon={TrashIcon} />
        </Button>
      </div>
    </li>
  );
}

function PlayDialog({
  video,
  category,
  onClose,
}: {
  video: EventVideo | null;
  category: string;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={video !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPopup className="max-w-[880px]">
        {video && (
          <>
            <div className="aspect-video w-full shrink-0 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${video.youtubeId}`}
                title={video.title}
                className="size-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {video.audioUrl && (
              <div className="border-line flex items-center gap-(--space-8) border-t px-(--space-16) py-(--space-10)">
                <audio
                  controls
                  src={video.audioUrl}
                  preload="none"
                  className="h-8 min-w-0 flex-1"
                />
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
              </div>
            )}
            <DialogFooter className="justify-between">
              <span className="flex min-w-0 flex-col">
                <DialogTitle className="truncate">{video.title}</DialogTitle>
                <span className="text-fg-3 truncate font-mono text-[11.5px] leading-[1.4]">
                  {category}
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
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="type-body text-fg-3 m-0 px-(--space-14) py-(--space-16)">
      {children}
    </p>
  );
}
