import { accountQueries } from "@/features/settings/api/queries";
import { ApplicationSettings } from "@/features/settings/components/application-settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings/application")({
  beforeLoad: ({ context: { access } }) => {
    access.guard(access.is("core", "school"));
  },
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(accountQueries.application());
  },
  component: ApplicationSettings,
});
