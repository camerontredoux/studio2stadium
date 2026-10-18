import { dancerQueries } from "@/features/dancer/api/queries";
import { SubmitPage } from "@/features/recruiting/components/submit/submit-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/recruiting/submit")({
  // Load the profile the page suspends on here, so the app shell stays on
  // screen instead of the full-page loader.
  loader: async ({ context: { queryClient, session } }) => {
    await queryClient.ensureQueryData(dancerQueries.profile(session.username));
  },
  component: SubmitPage,
});
