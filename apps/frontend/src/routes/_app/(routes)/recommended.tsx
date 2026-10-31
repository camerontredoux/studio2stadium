import { recommendedQueries } from "@/features/recommended/api/queries";
import { RecommendedPage } from "@/features/recommended/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/recommended")({
  // Awaited: the page suspends on it, and an unawaited prefetch let that
  // suspend into the full-page loader.
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(recommendedQueries.recommended());
  },
  component: RecommendedPage,
});
