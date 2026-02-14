import { Frame, FrameFooter, FramePanel } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";

function BlogCardSkeleton() {
  return (
    <Frame compact className="flex flex-col">
      <FramePanel side="top">
        <div className="relative border-b">
          <Skeleton className="h-48 w-full rounded-none" />
        </div>
        <div className="from-brand/10 via-background to-background relative flex flex-1 flex-col gap-2.5 bg-linear-to-br p-3 sm:p-4">
          <div className="mb-1 flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-5 w-4/5 rounded-sm" />
            <div className="my-1 flex items-center gap-1.5">
              <Skeleton className="size-3.5 rounded" />
              <Skeleton className="h-4 w-24 rounded-sm" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-full rounded-sm" />
              <Skeleton className="h-3.5 w-full rounded-sm" />
              <Skeleton className="h-3.5 w-2/3 rounded-sm" />
            </div>
          </div>
        </div>
      </FramePanel>
      <FrameFooter className="gap-2 px-3 py-2.5 sm:px-4">
        <Skeleton className="h-7 w-20 rounded-md sm:h-6" />
      </FrameFooter>
    </Frame>
  );
}

export function BlogListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3 lg:pt-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <BlogCardSkeleton key={i} />
      ))}
    </div>
  );
}
