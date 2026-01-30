import { queries } from "@/features/library/api/queries";
import { LibraryPage } from "@/features/library/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/resources/library")({
  validateSearch: (search: Record<string, unknown>) =>
    search as Partial<Record<string, string[] | string>>,
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(queries.filters());
  },
  component: LibraryPage,
});
