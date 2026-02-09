import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";

function EventCardSkeleton() {
  return (
    <Frame
      compact
      className="[contain-intrinsic-block-size:auto_400px] [content-visibility:auto]"
    >
      <FramePanel side="top">
        <div className="relative border-b">
          <Skeleton className="h-48 w-full rounded-none" />
          <Skeleton className="absolute top-2.5 left-2.5 h-5 w-16 rounded-full" />
        </div>

        <div className="my-1 flex flex-1 flex-col gap-2.5 p-3 sm:p-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-5 w-4/5" />
          </div>

          <div className="flex flex-col gap-2">
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

      <FrameFooter className="gap-2 px-3 py-2.5 sm:px-4">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-md" />
      </FrameFooter>
    </Frame>
  );
}

export function EventListSkeleton() {
  return (
    <div>
      <div className="sticky top-14 z-10 pb-3">
        <div className="flex items-center justify-between">
          <div className="border-brand/20 bg-background/90 flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-sm">
            <Skeleton className="size-3.5 rounded-full" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="bg-background rounded-lg">
            <Skeleton className="h-8 w-22 rounded-md" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {[3, 6].map((count, groupIdx) => (
          <div key={groupIdx} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
