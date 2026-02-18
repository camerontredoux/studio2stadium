import { recommendedQueries } from "@/features/recommended/api/queries";
import { RecommendedPage } from "@/features/recommended/page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/recommended")({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(recommendedQueries.recommended());
  },
  component: RecommendedPage,
});
