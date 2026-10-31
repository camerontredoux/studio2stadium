import { Skeleton } from "@/components/ui/skeleton";
import { PurchasesPage } from "@/features/admin/purchases";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/_admin/(routes)/admin/purchases")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <PurchasesPage />
    </Suspense>
  );
}
