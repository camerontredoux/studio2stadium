import { PremiumGuard } from "@/components/shared/premium-guard";
import { TrackerPage } from "@/features/tracker/page";
import { useRecruitingTrackerEnabled } from "@/shared/premium-roadmap/flag";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/tracker")({
  beforeLoad: ({ context: { access } }) => {
    access.guard(access.is("core", "dancer"));
  },
  component: RouteComponent,
});

// The tracker loads inside the guard, so dancers without Premium never
// request it (the API answers them with a 403).
function RouteComponent() {
  const enabled = useRecruitingTrackerEnabled();
  if (enabled === undefined) return null;
  if (!enabled) return <Navigate to="/feed" replace />;
  return (
    <PremiumGuard description="The Recruiting Tracker is a premium feature. Subscribe to track your schools, clinics, auditions, and deadlines in one place.">
      <TrackerPage />
    </PremiumGuard>
  );
}
