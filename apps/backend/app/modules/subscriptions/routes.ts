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

    router
      .post("manage", [ManageController])
      .openapi({
        summary: "Manage a subscription",
        description: "Manages the authenticated dancer's subscription",
      })
      .use(middleware.subscribed());

    if (!app.inProduction) {
      router.post("dev-grant", [DevGrantController]);
    }
  })
  .use(middleware.auth())
  .prefix("subscriptions")
  .openapi({ tags: ["Subscriptions"] });
