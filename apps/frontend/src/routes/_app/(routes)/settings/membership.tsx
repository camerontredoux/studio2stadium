import { MembershipSettings } from "@/features/settings/components/membership-settings";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/settings/membership")({
  beforeLoad: ({ context: { access } }) => {
    access.guard(access.is("core", "dancer"));
  },
  component: MembershipSettings,
});
