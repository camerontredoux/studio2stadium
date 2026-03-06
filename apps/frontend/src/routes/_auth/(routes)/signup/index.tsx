import { ChooseType } from "@/features/signup/components/choose-type";
import { queries } from "@/lib/session";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/(routes)/signup/")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(
      queries.session(),
    );
    if (session) {
      throw redirect({ to: "/feed" });
    }
  },
  component: ChooseType,
});
