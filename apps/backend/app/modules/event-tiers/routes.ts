import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const CreateCheckoutController = () => import("./checkout/controller.ts");

router
  .group(() => {
    router
      .post("checkout", [CreateCheckoutController])
      .openapi({
        summary: "Create an Event Tier checkout session",
        description:
          "Creates a one-time payment Checkout Session for the chosen Event Tier. Called by the marketing site before the buyer has a product session.",
      })
      .use(throttle("event-tier-checkout", 10));
  })
  .prefix("event-tiers")
  .openapi({ tags: ["Event Tiers"] });
