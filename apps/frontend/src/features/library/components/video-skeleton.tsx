import { Frame, FramePanel } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";

function VideoCardSkeleton() {
  return (
    <Frame compact className="flex flex-col">
      <FramePanel side="inset" className="flex flex-col">
        <div className="relative aspect-video w-full">
          <Skeleton className="h-full w-full rounded-none" />
          <Skeleton className="absolute top-2.5 left-2.5 h-5 w-16 rounded-full" />
        </div>

        <div className="from-brand/10 via-background to-background relative flex flex-1 flex-col gap-2.5 bg-linear-to-br p-3 sm:p-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="text-sm leading-snug">
              <Skeleton className="h-[1.375em] w-4/5 rounded-sm" />
            </div>
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
          className="relative mt-1 flex flex-col gap-2"
        >
          <div className="sticky top-24 z-10 mt-2">
            <div className="flex items-center justify-between gap-2">
              <div className="border-brand/20 bg-background/90 flex items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-sm">
                <Skeleton className="size-3.5 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 grid-rows-[auto] items-start gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: group.count }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
