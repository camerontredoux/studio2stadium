import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";
import app from "@adonisjs/core/services/app";

const GetStatusController = () => import("./get-status/controller.ts");
const ManageController = () => import("./manage-subscription/controller.ts");
const CheckoutController = () => import("./create-checkout/controller.ts");
const ConfirmCheckoutController = () =>
  import("./confirm-checkout/controller.ts");
const DevGrantController = () => import("./dev-grant/controller.ts");

router
  .group(() => {
    router.get("", [GetStatusController]).openapi({
      summary: "Get subscription status",
      description: "Gets the authenticated dancer's subscription status",
    });

    router.post("checkout", [CheckoutController]).openapi({
      summary: "Create a checkout session",
      description:
        "Creates a checkout session for the authenticated dancer: a one-time payment for the 1-Week Pass, or a subscription for Monthly, Season Pass, or Annual",
    });

    router.post("checkout/confirm", [ConfirmCheckoutController]).openapi({
      summary: "Confirm a completed checkout",
      description:
        "Fulfils the authenticated dancer's completed Stripe Checkout Session without waiting for the webhook, and returns their subscription status",
    });

    // Not behind `subscribed()`: a member whose renewal failed and whose
    // grace ran out has no access, yet must reach the billing portal to
    // update the card. The service only opens the portal for the user's own
    // Stripe customer and sends anyone without one to checkout.
    router.post("manage", [ManageController]).openapi({
      summary: "Manage a subscription",
      description:
        "Opens the Stripe billing portal for the authenticated dancer's subscription, including one whose renewal payment failed, or redirects to checkout when there is none",
    });

    if (!app.inProduction) {
      router.post("dev-grant", [DevGrantController]);
    }
  })
  .use(middleware.auth())
  .prefix("subscriptions")
  .openapi({ tags: ["Subscriptions"] });
