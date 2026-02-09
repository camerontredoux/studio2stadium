import { queries } from "@/features/events/api/queries";
import { Page } from "@/features/events/page";
import type { SearchFilter } from "@/features/explore/components/filters/types";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events/")({
  validateSearch: (search: Record<string, unknown>) => search as SearchFilter,
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(queries.filters());
    queryClient.ensureQueryData(queries.events());
  },
  component: Page,
});
