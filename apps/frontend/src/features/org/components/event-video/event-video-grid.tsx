import { PanelSubHead } from "@/components/event/panel";
import type {
  EventVideo,
  EventVideoGroup,
  VideoCategory,
} from "@/features/org/api/video-queries";

import { EventVideoCard } from "./event-video-card";

interface EventVideoGridProps {
  groups: EventVideoGroup[];
  onEdit?: (video: EventVideo) => void;
  onDelete?: (video: EventVideo) => void;
}

/** The event's videos, one section per category, each a grid of cards. */
export function EventVideoGrid({
  groups,
  onEdit,
  onDelete,
}: EventVideoGridProps) {
  if (groups.length === 0) {
    return (
      <p className="type-body text-fg-3 m-0 px-(--space-14) py-(--space-16)">
        Check back soon. Videos will be posted here before the event.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {groups.map((group) => (
        <CategorySection
          key={group.category.id}
          category={group.category}
          videos={group.videos}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

function CategorySection({
  category,
  videos,
  onEdit,
  onDelete,
}: {
  category: VideoCategory;
  videos: EventVideo[];
  onEdit?: (video: EventVideo) => void;
  onDelete?: (video: EventVideo) => void;
}) {
  return (
    <section
      aria-label={category.name}
      className="border-line not-first-of-type:border-t"
    >
      <PanelSubHead label={category.name} className="sticky top-0 z-10">
        <span className="type-data-sm text-fg-3">{videos.length}</span>
      </PanelSubHead>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-(--space-14) p-(--space-14)">
        {videos.map((video) => (
          <EventVideoCard
            key={video.id}
            video={video}
            category={category}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
