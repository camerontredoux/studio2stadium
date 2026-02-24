import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const StripeController = () => import("./stripe/controller.ts");

router
  .post("stripe/webhook", [StripeController])
  .use(middleware.verifyStripeWebhook());
