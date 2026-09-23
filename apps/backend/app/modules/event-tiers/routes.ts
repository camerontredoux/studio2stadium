import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const CreateCheckoutController = () => import("./checkout/controller.ts");
const GetCheckoutStatusController = () =>
  import("./checkout-status/controller.ts");

router
  .group(() => {
    router
      .post("checkout", [CreateCheckoutController])
      .openapi({
        summary: "Create an Event Tier checkout session",
        description:
          "Creates a one-time payment Checkout Session for the chosen Event Tier. Called by the marketing site, where nobody signs in: the buyer is the name and email they type, and no account is created here. Once the payment lands, provisioning finds the account for that email or creates one and emails a set-password link.",
      })
      .use(throttle("event-tier-checkout", 10));
    router
      .get("checkout/:sessionId", [GetCheckoutStatusController])
      .openapi({
        summary: "Get an Event Tier checkout's provisioning status",
        description:
          "Called by the marketing site when Checkout returns the buyer, with the session_id Stripe put in the return URL. Answers pending until the payment has been provisioned, then the Org's name and URL, and nextStep: set_password when the buyer was emailed a set-password link (the purchase created their account, or took over an unverified one), sign_in when they already had one. Never returns the buyer's email.",
      })
      .use(throttle("event-tier-checkout-status", 60));
  })
  .prefix("event-tiers")
  .openapi({ tags: ["Event Tiers"] });
