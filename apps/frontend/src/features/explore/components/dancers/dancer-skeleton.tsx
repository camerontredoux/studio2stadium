import { Skeleton } from "@/components/ui/skeleton";

function DancerCardSkeleton() {
  return (
    <div className="relative flex flex-row gap-3 overflow-clip rounded-2xl border bg-clip-padding p-3 sm:h-25 sm:items-center sm:p-4">
      <Skeleton className="size-16 shrink-0 rounded-xl" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <Skeleton className="h-4.5 w-48" />
            <Skeleton className="size-4 rounded-full" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  );
}

export function DancerListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <DancerCardSkeleton key={i} />
      ))}
    </div>
  );
}
