import type {
  EventVideo,
  EventVideoGroup,
  VideoCategory,
} from "@/features/org/api/video-queries";
import { EventVideoCard } from "./event-video-card";

const ACCENT_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-cyan-500",
];

interface EventVideoGridProps {
  groups: EventVideoGroup[];
  onEdit?: (video: EventVideo) => void;
  onDelete?: (video: EventVideo) => void;
}

export function EventVideoGrid({
  groups,
  onEdit,
  onDelete,
}: EventVideoGridProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-sm">
          Check back soon — videos will be posted here before the event.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {groups.map((group, i) => (
        <CategorySection
          key={group.category.id}
          category={group.category}
          videos={group.videos}
          accentColor={ACCENT_COLORS[i % ACCENT_COLORS.length]}
          onEdit={onEdit}
          onDelete={onDelete}
          showBorder={i > 0}
        />
      ))}
    </div>
  );
}

function CategorySection({
  category,
  videos,
  accentColor,
  onEdit,
  onDelete,
  showBorder,
}: {
  category: VideoCategory;
  videos: EventVideo[];
  accentColor: string;
  onEdit?: (video: EventVideo) => void;
  onDelete?: (video: EventVideo) => void;
  showBorder: boolean;
}) {
  return (
    <div className="px-4">
      <div
        className={`sticky top-0 z-10 bg-background flex items-center gap-2 pt-4 pb-3 ${showBorder ? "border-border border-t" : ""}`}
      >
        <div className={`size-1.5 shrink-0 rounded-full ${accentColor}`} />
        <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
          {category.name}
        </span>
        <span className="text-muted-foreground/60 text-[11px]">
          {videos.length} {videos.length === 1 ? "video" : "videos"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 pb-5 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
