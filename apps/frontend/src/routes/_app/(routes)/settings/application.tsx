import { ApplicationSettings } from "@/features/settings/components/application-settings";
import { queries } from "@/lib/session";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings/application")({
  beforeLoad: ({ context: { access } }) => {
    access.guard(access.is("core", "school"));
  },
  // Load the application the page suspends on here, so the app shell stays
  // on screen instead of the full-page loader.
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(queries.application());
  },
  component: ApplicationSettings,
});
