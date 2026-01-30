import { queries } from "@/features/events/api/queries";
import { Page } from "@/features/events/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events/")({
  validateSearch: (search: Record<string, unknown>) =>
    search as Partial<Record<string, string[] | string>>,
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(queries.filters());
  },
  component: Page,
});
