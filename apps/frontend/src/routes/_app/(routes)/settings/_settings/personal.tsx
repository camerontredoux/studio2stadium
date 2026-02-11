import { dancerQueries } from "@/features/dancer/api/queries";
import { schoolQueries } from "@/features/school/api/queries";
import { PersonalSettings } from "@/features/settings/components/personal-settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/(routes)/settings/_settings/personal",
)({
  loader: async ({ context: { queryClient, session } }) => {
    if (session.type === "dancer") {
      await queryClient.ensureQueryData(dancerQueries.settings.profile());
    } else {
      await queryClient.ensureQueryData(schoolQueries.settings.profile());
    }
  },
  component: PersonalSettings,
});
