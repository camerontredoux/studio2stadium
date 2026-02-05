import { queries } from "@/features/explore/api/queries";
import { ExplorePage } from "@/features/explore/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/explore/")({
  validateSearch: (search: Record<string, unknown>) =>
    search as Partial<Record<string, string[] | string>>,
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(queries.schools({}));
    queryClient.ensureQueryData(queries.filters());
  },
  component: ExplorePage,
});
