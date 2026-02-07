import type { SearchFilter } from "@/features/explore/components/filters/types";
import { queries } from "@/features/library/api/queries";
import { LibraryPage } from "@/features/library/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources/library")({
  validateSearch: (search: Record<string, unknown>) => search as SearchFilter,
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(queries.filters());
  },
  component: LibraryPage,
});
