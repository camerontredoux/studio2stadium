import { exploreQueries } from "@/features/explore/api/queries";
import type { SchoolSearchFilter } from "@/features/explore/components/schools/filters/types";
import { ExplorePage } from "@/features/explore/page";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/explore/")({
  validateSearch: (search: Record<string, unknown>) =>
    search as SchoolSearchFilter,
  loaderDeps: ({ search }) => ({ search }),
  beforeLoad: ({ context: { session } }) => {
    if (session.type === "school") {
      throw redirect({ to: "/dancers" });
    }
  },
  loader: ({ context: { queryClient }, deps: { search } }) => {
    const { name: _, ...filters } = search;
    queryClient.ensureQueryData(exploreQueries.schoolsFilters());
    queryClient.ensureQueryData(exploreQueries.schools(filters));
  },
  component: ExplorePage,
});
