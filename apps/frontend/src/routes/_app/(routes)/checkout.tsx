import { CheckoutPage } from "@/features/checkout/page";
import { queries } from "@/lib/session";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/checkout")({
  beforeLoad: async ({ context: { session, queryClient } }) => {
    if (session.type === "school") {
      throw redirect({ to: "/feed" });
    }

    const subscription = await queryClient.ensureQueryData(
      queries.subscribed(session.type === "dancer"),
    );

    if (subscription.subscribed) {
      throw redirect({ to: "/feed" });
    }
  },
  component: CheckoutPage,
});
