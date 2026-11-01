import { PremiumGuard } from "@/components/shared/premium-guard";
import { TrackerSkeleton } from "@/features/tracker/components/tracker-skeleton";
import { TrackerPage } from "@/features/tracker/page";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/_app/(routes)/tracker")({
  beforeLoad: ({ context: { access } }) => {
    access.guard(access.is("core", "dancer"));
  },
  component: RouteComponent,
});

// The tracker loads inside the guard, so dancers without Premium never
// request it (the API answers them with a 403). Its own Suspense keeps the
// app shell on screen while it loads.
function RouteComponent() {
  return (
    <PremiumGuard description="The Recruiting Tracker is a premium feature. Subscribe to track your schools, clinics, auditions, and deadlines in one place.">
      <Suspense fallback={<TrackerSkeleton />}>
        <TrackerPage />
      </Suspense>
    </PremiumGuard>
  );
}
