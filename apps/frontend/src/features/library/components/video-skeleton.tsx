import { Skeleton } from "@/components/ui/skeleton";
import { Frame, FramePanel } from "@/components/ui/frame";

function VideoCardSkeleton() {
  return (
    <Frame
      compact
      className="[contain-intrinsic-block-size:auto_300px] [content-visibility:auto]"
    >
      <FramePanel side="inset">
        <div className="relative aspect-video">
          <Skeleton className="h-full w-full" />
          <Skeleton className="absolute top-2.5 left-2.5 h-5 w-16 rounded-full" />
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-3 sm:p-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4.5 w-4/5" />
          </div>
        </div>
      </FramePanel>
    </Frame>
  );
}

export function VideoListSkeleton() {
  const skeletonGroups = [
    { category: "loading-1", count: 3 },
    { category: "loading-2", count: 4 },
  ];

  return (
    <div className="flex flex-col gap-2 lg:gap-4">
      {skeletonGroups.map((group) => (
        <section
          key={group.category}
          className="relative flex flex-col gap-2 lg:gap-3"
        >
          <div className="sticky top-24 z-10 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="bg-background/90 border-muted flex items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-sm">
                <Skeleton className="size-3.5 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-sm" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
            {Array.from({ length: group.count }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
