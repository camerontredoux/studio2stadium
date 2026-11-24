import { Skeleton } from "@/components/ui/skeleton";

export function PrioritySpotlightSkeleton() {
  return (
    <div className="border-brand/40 overflow-clip rounded-2xl border">
      <div className="from-brand/10 via-brand/5 to-background bg-linear-to-br p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-72 rounded-full" />
      </div>
      <div className="border-t p-2 sm:p-4">
        <div className="bg-card flex flex-col gap-4 rounded-xl border p-3 sm:flex-row sm:p-4">
          <Skeleton className="size-28 shrink-0 self-center rounded-xl sm:size-36 sm:self-start" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1 h-9 w-full rounded-lg sm:w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
