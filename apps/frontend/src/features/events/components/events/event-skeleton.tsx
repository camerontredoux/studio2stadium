import { Skeleton } from "@/components/ui/skeleton";
import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";

function EventCardSkeleton() {
  return (
    <Frame compact className="[content-visibility:auto] [contain-intrinsic-block-size:auto_400px]">
      <FramePanel side="top">
        <div className="relative border-b">
          <Skeleton className="w-full h-48" />
          <Skeleton className="absolute top-2.5 left-2.5 h-5 w-16 rounded-full" />
        </div>

        <div className="p-3 sm:p-4 flex flex-col gap-2.5 flex-1">
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-2/5 sm:mb-1" />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-3.5 w-32" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-3.5 w-40" />
            </div>
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          </div>
        </div>
      </FramePanel>

      <FrameFooter className="gap-2 px-3 sm:px-4 py-2.5">
        <Skeleton className="h-7 w-20 rounded-md" />
        <Skeleton className="h-7 w-24 rounded-md" />
      </FrameFooter>
    </Frame>
  );
}

export function EventListSkeleton() {
  const skeletonGroups = [
    { month: "loading-1", count: 3 },
    { month: "loading-2", count: 4 },
  ];

  return (
    <div className="flex flex-col gap-2 lg:gap-4">
      {skeletonGroups.map((group) => (
        <section
          key={group.month}
          className="flex flex-col gap-2 lg:gap-3 relative"
        >
          <div className="sticky top-12 z-10 py-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-muted px-2.5 py-1">
                <Skeleton className="size-3.5 rounded-full" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
            {Array.from({ length: group.count }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
