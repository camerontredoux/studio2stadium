import { Skeleton } from "@/components/ui/skeleton";

function FeedItemSkeleton() {
  return (
    <div className="overflow-clip sm:rounded-2xl sm:border">
      <Skeleton className="aspect-video w-full" />
      <div className="flex flex-col gap-2 py-2 sm:gap-4 sm:p-4">
        <div className="flex items-start gap-2">
          <Skeleton className="size-8 shrink-0 rounded-full sm:size-9" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32 sm:h-[18px] sm:w-40" />
            <Skeleton className="h-3 w-24 sm:h-[14px] sm:w-28" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full max-w-[90%] sm:h-4" />
          <Skeleton className="h-3 w-2/3 max-w-[70%] sm:h-4" />
          <div className="flex items-center gap-2 border-t pt-2">
            <Skeleton className="h-7 w-16 rounded-md sm:h-6 sm:w-14" />
            <Skeleton className="h-7 w-16 rounded-md sm:h-6 sm:w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-2 sm:pb-6 lg:gap-4 lg:pb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <FeedItemSkeleton key={i} />
      ))}
    </div>
  );
}
