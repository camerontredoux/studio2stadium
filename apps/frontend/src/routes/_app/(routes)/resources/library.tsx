import { AccessDenied } from "@/components/shared/access-denied";
import type { SearchFilter } from "@/features/explore/components/filters/types";
import { queries } from "@/features/library/api/queries";
import { LibraryPage } from "@/features/library/page";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources/library")({
  validateSearch: (search: Record<string, unknown>) => search as SearchFilter,
  beforeLoad: ({ context: { session } }) => {
    if (session.type === "school") {
      throw redirect({ to: "/resources/favorites" });
    }
  },
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(queries.videos());
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { subscription } = Route.useRouteContext();

  if (!subscription.subscribed) {
    return (
      <div className="pt-4">
        <AccessDenied description="Resources is a premium feature. Subscribe to unlock this page and get full access." />
      </div>
    );
  }

  return <LibraryPage />;
}
