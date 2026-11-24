import { MySpotlightsPage } from "@/features/recruiting/components/my-spotlights/page";
import { recruitingQueries } from "@/features/recruiting/api/queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/(routes)/recruiting/my-spotlights",
)({
  beforeLoad: ({ context: { access } }) => {
    access.guard(access.is("core", "dancer"));
  },
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(recruitingQueries.mySpotlights());
  },
  component: MySpotlightsPage,
});
