import { Skeleton } from "@/components/ui/skeleton";

function SchoolCardSkeleton() {
  return (
    <div className="sm:h-26 relative rounded-xl border bg-clip-padding overflow-clip p-3 sm:p-4 flex gap-3 sm:items-center flex-row">
      {/* Avatar */}
      <Skeleton className="size-16 rounded-xl shrink-0" />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="size-4 rounded-full" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 flex-col sm:shrink-0">
        <Skeleton className="h-7 w-16 rounded-md" />
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
    </div>
  );
}

export function SchoolListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <SchoolCardSkeleton key={i} />
      ))}
    </div>
  );
}
