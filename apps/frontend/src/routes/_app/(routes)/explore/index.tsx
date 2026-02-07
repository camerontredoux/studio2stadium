import { queries } from "@/features/explore/api/queries";
import type { SearchFilter } from "@/features/explore/components/filters/types";
import { ExplorePage } from "@/features/explore/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/explore/")({
  validateSearch: (search: Record<string, unknown>) => search as SearchFilter,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context: { queryClient }, deps: { search } }) => {
    const { name: _, ...filters } = search;
    queryClient.ensureQueryData(queries.schools(filters));
    queryClient.ensureQueryData(queries.filters());
  },
  component: ExplorePage,
});
