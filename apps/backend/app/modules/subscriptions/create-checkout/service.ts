import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { WEEK_PASS_PURCHASE } from "#modules/subscriptions/fulfill-checkout/service";
import stripe from "#payments/stripe/main";
import { priceIdFor, type PaidPlan } from "#shared/plans";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private subscriptions: GetSubscriptionService) {}

  async execute(userId: string, email: string, payload: Validator) {
    const plan: PaidPlan =
      payload.plan ?? (payload.type === "yearly" ? "annual" : "monthly");

    const price = priceIdFor(plan);
    if (!price) {
      throw new E_BAD_REQUEST("This plan isn't available yet.");
    }

    // A second subscription would bill the Dancer twice. Changing plans
    // happens in Stripe's billing portal instead.
    const status = await this.subscriptions.execute(userId);
    if (status.source === "stripe") {
      throw new E_BAD_REQUEST(
        "You already have a subscription. Manage it from Membership settings."
      );
    }

    const isWeekPass = plan === "week_pass";

    return await stripe.api.checkout.sessions.create({
      client_reference_id: userId,
      customer_email: email,
      mode: isWeekPass ? "payment" : "subscription",
      ...(isWeekPass && { metadata: { purchase: WEEK_PASS_PURCHASE } }),
      allow_promotion_codes: true,
      payment_method_types: ["card"],
      ui_mode: "embedded",
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      // The app confirms the session on return, so access shows at once
      // even when the webhook has not arrived yet.
      return_url: `${env.get("SITE_URL")}/settings/membership?session_id={CHECKOUT_SESSION_ID}`,
    });
  }
}
