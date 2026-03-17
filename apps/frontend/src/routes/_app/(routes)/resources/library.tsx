import { PremiumGuard } from "@/components/shared/premium-guard";
import type { SchoolSearchFilter } from "@/features/explore/components/schools/filters/types";
import { queries } from "@/features/library/api/queries";
import { LibraryPage } from "@/features/library/page";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources/library")({
  validateSearch: (search: Record<string, unknown>) =>
    search as SchoolSearchFilter,
  beforeLoad: ({ context: { session } }) => {
    if (session.type === "school" && session.role !== "admin") {
      throw redirect({ to: "/resources/favorites" });
    }
  },
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(queries.videos());
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PremiumGuard
      description="Resources is a premium feature. Subscribe to unlock this page and get full access."
      className="pt-4"
    >
      <LibraryPage />
    </PremiumGuard>
  );
}
