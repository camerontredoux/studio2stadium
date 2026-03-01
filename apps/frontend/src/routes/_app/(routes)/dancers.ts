import { exploreQueries } from "@/features/explore/api/queries";
import type { DancerSearchFilter } from "@/features/explore/components/dancers/filters/types";
import { ExplorePage } from "@/features/explore/page";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/dancers")({
  validateSearch: (search: Record<string, unknown>) =>
    search as DancerSearchFilter,
  loaderDeps: ({ search }) => ({ search }),
  beforeLoad: ({ context: { access, session } }) => {
    access.guard(access.is("core", "school"));

    if (!session.verified) {
      throw redirect({ to: "/onboarding" });
    }
  },
  loader: ({ context: { queryClient }, deps: { search } }) => {
    queryClient.ensureQueryData(exploreQueries.dancersFilters());
    queryClient.ensureQueryData(exploreQueries.dancers(search));
  },
  component: ExplorePage,
});
