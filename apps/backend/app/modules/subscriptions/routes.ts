import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const SubscriptionController = () => import("./status/controller.ts");
const ManageController = () => import("./manage/controller.ts");
const CheckoutController = () => import("./checkout/controller.ts");

router
  .group(() => {
    router.get("status", [SubscriptionController]).openapi({
      summary: "Get subscription status",
      description: "Gets the authenticated dancer's subscription status",
    });

    router.post("checkout", [CheckoutController]).openapi({
      summary: "Create a checkout session",
      description: "Creates a checkout session for the authenticated dancer",
    });

    router
      .post("manage", [ManageController])
      .openapi({
        summary: "Manage a subscription",
        description: "Manages the authenticated dancer's subscription",
      })
      .use(middleware.subscribed());
  })
  .use(middleware.auth())
  .prefix("subscriptions")
  .openapi({ tags: ["Subscriptions"] });
