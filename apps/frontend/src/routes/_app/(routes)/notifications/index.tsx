import { notificationQueries } from "@/features/notifications/api/queries";
import { Page } from "@/features/notifications/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/notifications/")({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureInfiniteQueryData(notificationQueries.notifications());
  },
  component: Page,
});
