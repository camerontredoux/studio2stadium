import { middleware } from "#start/kernel";
import { throttle } from "#start/limiter";
import router from "@adonisjs/core/services/router";

const CreateCheckoutController = () => import("./checkout/controller.ts");
const GetCheckoutStatusController = () =>
  import("./checkout-status/controller.ts");
// By alias, not "./claim/...": Tuyau matches a relative controller path by its
// suffix, and "claim/controller.ts" also ends admin/resend-event-tier-claim's.
const ClaimOrgController = () =>
  import("#modules/event-tiers/claim/controller");

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
          "Called by the marketing site when Checkout returns the buyer, with the session_id Stripe put in the return URL. Answers pending until the payment has been provisioned, then the Org's name and URL, and nextStep: set_password when the buyer was emailed a set-password link (the purchase created their account), claim when the purchase landed on an existing account whose owner has not proved they read its inbox (they were emailed a claim link, and the Org is theirs once they open it signed in), sign_in when they already had an account the Org was attached to. Never returns the buyer's email.",
      })
      .use(throttle("event-tier-checkout-status", 60));
    router
      .post("claim", [ClaimOrgController])
      .openapi({
        summary: "Claim an Org bought for your account",
        description:
          "Called by the product's claim page, signed in, with the token and userId from the claim link a purchase emailed. Refused with 403 when the signed-in user is not the account the link was sent for, and 400 when the token is wrong, expired or already used. Otherwise gives the user the organizer admin membership of every Org bought for their account that is awaiting a claim, records that they read the account's inbox, and returns every Org they have claimed. Idempotent.",
      })
      .use([middleware.auth(), throttle("event-tier-claim", 10)]);
  })
  .prefix("event-tiers")
  .openapi({ tags: ["Event Tiers"] });
