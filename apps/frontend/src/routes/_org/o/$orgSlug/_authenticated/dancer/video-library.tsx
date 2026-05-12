import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useDeferredValue, useMemo, useState } from "react";
import { StatCell } from "@/features/org/components/dashboard-shared";
import { EventVideoGrid } from "@/features/org/components/event-video/event-video-grid";
import { VideoLibraryToolbar } from "@/features/org/components/event-video/video-library-toolbar";
import {
  videoQueries,
  type EventVideoGroup,
} from "@/features/org/api/video-queries";
import { adminQueries } from "@/features/org/api/admin-queries";
import { isAfter, subDays } from "date-fns";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/video-library",
)({
  component: DancerVideoLibrary,
});

function DancerVideoLibrary() {
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

  const newThisWeek = useMemo(() => {
    const weekAgo = subDays(new Date(), 7);
    return videos.filter((v) => isAfter(new Date(v.createdAt), weekAgo)).length;
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
          catVideos = catVideos.filter((v) => v.title.toLowerCase().includes(q));
        }

        return { category: cat, videos: catVideos };
      })
      .filter((g) => {
        if (categoryFilter && g.category.id !== categoryFilter) return false;
        return g.videos.length > 0;
      });
  }, [categories, videos, categoryFilter, deferredSearch]);

  const categoriesWithVideos = useMemo(
    () => categories.filter((c) => videos.some((v) => v.categoryId === c.id)),
    [categories, videos],
  );

  if (!activeEvent) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">No active event.</p>
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

      <section aria-label="Video stats" className="border-border flex items-stretch border-y">
        <StatCell label="Total Videos" value={videos.length} />
        <StatCell label="Categories" value={categoriesWithVideos.length} />
        <StatCell label="New This Week" value={newThisWeek} accent="blue" />
      </section>

      <VideoLibraryToolbar
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        categories={categoriesWithVideos}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        <EventVideoGrid groups={groups} />
      </div>
    </div>
  );
}
