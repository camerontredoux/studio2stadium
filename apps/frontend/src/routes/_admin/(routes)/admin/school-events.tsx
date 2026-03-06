import { Skeleton } from "@/components/ui/skeleton";
import { SchoolEventsPage } from "@/features/admin/school-events";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/_admin/(routes)/admin/school-events")({
  component: RouteComponent,
});

function TableSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="rounded-md border">
          <div className="border-b p-4">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b p-4 last:border-b-0">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <SchoolEventsPage />
    </Suspense>
  );
}
