import { accountQueries } from "@/features/settings/api/queries";
import { AccountSettings } from "@/features/settings/components/account-settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings/membership")({
  beforeLoad: ({ context: { access } }) => {
    access.guard(access.is("core", "dancer"));
  },
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(accountQueries.account());
  },
  component: AccountSettings,
});
