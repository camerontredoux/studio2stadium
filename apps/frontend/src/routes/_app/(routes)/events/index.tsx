import { eventQueries } from "@/features/events/api/queries";
import { Page } from "@/features/events/page";
import type { SearchFilter } from "@/features/explore/components/filters/types";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events/")({
  validateSearch: (search: Record<string, unknown>) => search as SearchFilter,
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(eventQueries.events());
    queryClient.ensureQueryData(eventQueries.globalEvents());
  },
  component: Page,
});
