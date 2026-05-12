import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import { StatCell } from "@/features/org/components/dashboard-shared";
import { EventVideoGrid } from "@/features/org/components/event-video/event-video-grid";
import { VideoLibraryToolbar } from "@/features/org/components/event-video/video-library-toolbar";
import { ManageCategoriesDialog } from "@/features/org/components/event-video/manage-categories-dialog";
import { AddEditVideoDialog } from "@/features/org/components/event-video/add-edit-video-dialog";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  videoQueries,
  useDeleteVideo,
  type EventVideo,
  type EventVideoGroup,
} from "@/features/org/api/video-queries";
import { adminQueries } from "@/features/org/api/admin-queries";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/admin/video-library",
)({
  component: AdminVideoLibrary,
});

function AdminVideoLibrary() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const activeEvent = events.find((e) => e.isActive);
  const eventId = activeEvent?.id ?? "";

  const { data: categories = [] } = useQuery(
    videoQueries.categories(orgSlug, eventId),
  );
  const { data: videos = [] } = useQuery(
    videoQueries.videos(orgSlug, eventId),
  );

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<EventVideo | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<EventVideo | null>(null);

  const deleteVideo = useDeleteVideo(orgSlug, eventId);

  const videoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of videos) {
      counts[v.categoryId] = (counts[v.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [videos]);

  const groups: EventVideoGroup[] = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted
      .map((cat) => {
        let catVideos = videos
          .filter((v) => v.categoryId === cat.id)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        if (deferredSearch) {
          const q = deferredSearch.toLowerCase();
          catVideos = catVideos.filter((v) =>
            v.title.toLowerCase().includes(q),
          );
        }

        return { category: cat, videos: catVideos };
      })
      .filter((g) => {
        if (categoryFilter && g.category.id !== categoryFilter) return false;
        return g.videos.length > 0;
      });
  }, [categories, videos, categoryFilter, deferredSearch]);

  const lastUpdated = useMemo(() => {
    if (videos.length === 0) return "—";
    const newest = videos.reduce((a, b) =>
      a.updatedAt > b.updatedAt ? a : b,
    );
    return formatDistanceToNow(new Date(newest.updatedAt), { addSuffix: true });
  }, [videos]);

  function handleEdit(video: EventVideo) {
    setEditingVideo(video);
    setAddEditOpen(true);
  }

  function handleDelete(video: EventVideo) {
    setDeletingVideo(video);
  }

  function confirmDelete() {
    if (!deletingVideo) return;
    deleteVideo.mutate(deletingVideo.id, {
      onSettled: () => setDeletingVideo(null),
    });
  }

  if (!activeEvent) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          No active event. Create or activate an event to manage videos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="px-4 py-4">
        <h1 className="text-lg font-semibold tracking-tight 2xl:text-xl">
          Video Library
        </h1>
      </header>

      <section
        aria-label="Video stats"
        className="border-border flex items-stretch border-y"
      >
        <StatCell label="Total Videos" value={videos.length} />
        <StatCell label="Categories" value={categories.length} />
        <StatCell label="Last Updated" value={lastUpdated} />
      </section>

      <VideoLibraryToolbar
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categories={categories}
        onManageCategories={() => setManageCategoriesOpen(true)}
        onAddVideo={() => {
          setEditingVideo(null);
          setAddEditOpen(true);
        }}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        <EventVideoGrid
          groups={groups}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <ManageCategoriesDialog
        open={manageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
        categories={categories}
        videoCounts={videoCounts}
        slug={orgSlug}
        eventId={eventId}
      />

      <AddEditVideoDialog
        open={addEditOpen}
        onOpenChange={setAddEditOpen}
        categories={categories}
        slug={orgSlug}
        eventId={eventId}
        editingVideo={editingVideo}
      />

      <AlertDialog
        open={!!deletingVideo}
        onOpenChange={(open) => {
          if (!open) setDeletingVideo(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &ldquo;{deletingVideo?.title}&rdquo;? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="ghost" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={deleteVideo.isPending}
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
