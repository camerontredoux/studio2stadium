import { eventQueries } from "@/features/events/api/queries";
import { Page } from "@/features/events/page";
import type { SchoolSearchFilter } from "@/features/explore/components/schools/filters/types";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events/")({
  validateSearch: (search: Record<string, unknown>) =>
    search as SchoolSearchFilter,
  beforeLoad: ({ context: { session } }) => {
    if (!session.verified) {
      throw redirect({ to: "/settings/application" });
    }
  },
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(eventQueries.events());
    queryClient.ensureQueryData(eventQueries.globalEvents());
  },
  component: Page,
});
