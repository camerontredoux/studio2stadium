import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const ManageController = () => import("./manage/controller.ts");
const CheckoutController = () => import("./checkout/controller.ts");

router
  .group(() => {
    router.post("checkout", [CheckoutController]).openapi({
      summary: "Create a checkout session",
      description: "Creates a checkout session for the authenticated dancer",
    });

    router.post("manage", [ManageController]).openapi({
      summary: "Manage a subscription",
      description: "Manages the authenticated dancer's subscription",
    });
  })
  .use(middleware.auth())
  .prefix("subscriptions")
  .openapi({ tags: ["Subscriptions"] });
