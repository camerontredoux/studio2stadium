import { eventQueries } from "@/features/events/api/queries";
import type { EventSearchFilter } from "@/features/events/components/filters/types";
import { Page } from "@/features/events/page";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/events/")({
  validateSearch: (search: Record<string, unknown>) =>
    search as EventSearchFilter,
  loaderDeps: ({ search }) => ({ search }),
  beforeLoad: ({ context: { session } }) => {
    if (!session.verified) {
      throw redirect({ to: "/settings/application" });
    }
  },
  loader: ({ context: { queryClient }, deps: { search } }) => {
    queryClient.prefetchQuery(eventQueries.filters());
    queryClient.prefetchQuery(eventQueries.events(search));
    queryClient.prefetchQuery(eventQueries.globalEvents());
  },
  component: Page,
});
