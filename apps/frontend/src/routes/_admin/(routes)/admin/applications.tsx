import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationsPage } from "@/features/admin/applications";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/_admin/(routes)/admin/applications")({
  component: RouteComponent,
});

function TableSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="rounded-md border">
        <div className="border-b p-4">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="hidden h-4 w-32 sm:block" />
            <Skeleton className="hidden h-4 w-24 lg:block" />
            <Skeleton className="hidden h-4 w-20 md:block" />
            <Skeleton className="hidden h-4 w-16 sm:block" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b p-4 last:border-b-0">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-4 w-40 sm:block" />
            <Skeleton className="hidden h-4 w-24 lg:block" />
            <Skeleton className="hidden h-4 w-16 md:block" />
            <Skeleton className="hidden h-6 w-20 sm:block" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-14" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RouteComponent() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <ApplicationsPage />
    </Suspense>
  );
}
