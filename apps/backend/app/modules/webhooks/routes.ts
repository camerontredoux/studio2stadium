import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const StripeController = () => import("./stripe/controller.ts");
const CloudflareController = () => import("./cloudflare/controller.ts");

router
  .post("stripe/webhook", [StripeController])
  .use(middleware.verifyStripeWebhook());

router
  .post("cloudflare/stream/webhook", [CloudflareController])
  .use(middleware.verifyCloudflareWebhook());
