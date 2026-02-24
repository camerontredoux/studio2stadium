import { CheckoutPage } from "@/features/checkout/page";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/(routes)/checkout")({
  beforeLoad: ({ context: { session } }) => {
    if (session.type === "school") {
      throw redirect({ to: "/feed" });
    }
    if (session.subscribed) {
      throw redirect({ to: "/feed" });
    }
  },
  component: CheckoutPage,
});
