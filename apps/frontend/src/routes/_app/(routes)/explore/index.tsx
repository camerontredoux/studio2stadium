import { exploreQueries } from "@/features/explore/api/queries";
import type { SchoolSearchFilter } from "@/features/explore/components/schools/filters/types";
import { ExplorePage } from "@/features/explore/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/explore/")({
  validateSearch: (search: Record<string, unknown>) =>
    search as SchoolSearchFilter,
  loaderDeps: ({ search }) => ({ search }),
  beforeLoad: ({ context: { access } }) => {
    access.guard(access.is("core", "dancer"));
  },
  loader: ({ context: { queryClient }, deps: { search } }) => {
    const { name: _, ...filters } = search;
    queryClient.ensureQueryData(exploreQueries.schoolsFilters());
    queryClient.ensureQueryData(exploreQueries.schools(filters));
  },
  component: ExplorePage,
});
