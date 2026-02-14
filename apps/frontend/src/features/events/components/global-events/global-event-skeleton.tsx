import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";

function GlobalEventCardSkeleton() {
  return (
    <Frame compact className="group">
      <FramePanel side="top">
        <div className="relative isolate transform-gpu border-b">
          <Skeleton className="h-48 w-full rounded-none" />
          <Skeleton className="absolute top-2.5 left-2.5 h-5 w-16 rounded-full" />
        </div>

        <div className="from-brand/10 via-background to-background group-hover:from-brand/8 group-hover:via-brand/4 relative flex flex-1 flex-col gap-2.5 bg-linear-to-br p-3 transition-colors duration-75 sm:p-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="text-base leading-snug font-semibold">
              <Skeleton className="h-[1.375em] w-4/5 rounded-sm" />
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-1.5">
                <Skeleton className="size-3.5 shrink-0 rounded-full" />
                <Skeleton className="h-[1.375em] w-32 rounded-sm" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="size-3.5 shrink-0 rounded-full" />
                <Skeleton className="h-[1.375em] w-40 rounded-sm" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="size-3.5 shrink-0 rounded-full" />
                <Skeleton className="h-[1.375em] w-28 rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </FramePanel>

      <FrameFooter className="gap-2 px-3 py-2.5 sm:px-4">
        <div className="flex w-full items-center justify-between gap-2">
          <Skeleton className="h-7 w-20 rounded-md sm:h-6" />
          <Skeleton className="h-7 w-24 rounded-md sm:h-6" />
        </div>
      </FrameFooter>
    </Frame>
  );
}

export function GlobalEventListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[3, 6].map((count, groupIdx) => (
        <div
          key={groupIdx}
          className="grid grid-cols-1 grid-rows-[auto] items-start gap-2 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: count }).map((_, i) => (
            <GlobalEventCardSkeleton key={i} />
          ))}
        </div>
      ))}
    </div>
  );
}
