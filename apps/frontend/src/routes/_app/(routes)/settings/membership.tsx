import { MembershipSettings } from "@/features/settings/components/membership-settings";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/_app/(routes)/settings/membership")({
  // Stripe Checkout returns here with the session it completed.
  validateSearch: z.object({
    session_id: z.string().optional(),
  }),
  beforeLoad: ({ context: { access } }) => {
    access.guard(access.is("core", "dancer"));
  },
  component: MembershipSettings,
});
