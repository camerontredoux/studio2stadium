import { Skeleton } from "@/components/ui/skeleton";

function SchoolCardSkeleton() {
  return (
    <div className="relative flex flex-row gap-3 overflow-clip rounded-xl border bg-clip-padding p-3 sm:h-26 sm:items-center sm:p-4">
      <Skeleton className="size-16 shrink-0 rounded-xl" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
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

      <div className="flex flex-col gap-2 sm:shrink-0">
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
