import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { WEEK_PASS_PURCHASE } from "#modules/subscriptions/fulfill-checkout/service";
import { PromotionRedemptionService } from "#modules/subscriptions/record-promotion-redemption/service";
import stripe from "#payments/stripe/main";
import { priceIdFor, type PaidPlan } from "#shared/plans";
import env from "#start/env";
import { inject } from "@adonisjs/core";
import { checkoutDisclosure } from "./disclosure.ts";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(
    private subscriptions: GetSubscriptionService,
    private promotions: PromotionRedemptionService
  ) {}

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
    // The same goes for a subscription whose renewal failed and whose grace
    // ran out: it is still live in Stripe, and a new card brings it back.
    if (status.paymentFailed) {
      throw new E_BAD_REQUEST(
        "Your last payment didn't go through. Update your card from Membership settings to restore your plan."
      );
    }

    const isWeekPass = plan === "week_pass";

    // A Week Pass holder who subscribes is not charged until the pass runs
    // out: the pass's unused days are credited toward the new plan.
    const firstChargeAt = isWeekPass ? null : status.upgradeFirstChargeAt;

    const stripePrice = await stripe.api.prices.retrieve(price);

    // Stripe cannot refuse one code per customer, so an account that has
    // used a once-per-account code (S2SSAVE) gets no promotion code field.
    const allowPromotionCodes = !(await this.promotions.hasRedeemed(userId));

    return await stripe.api.checkout.sessions.create({
      client_reference_id: userId,
      customer_email: email,
      mode: isWeekPass ? "payment" : "subscription",
      ...(isWeekPass && { metadata: { purchase: WEEK_PASS_PURCHASE } }),
      ...(firstChargeAt && {
        subscription_data: {
          trial_end: Math.floor(firstChargeAt.getTime() / 1000),
          metadata: { credited_week_pass_until: firstChargeAt.toISOString() },
        },
      }),
      custom_text: {
        submit: { message: checkoutDisclosure(stripePrice, firstChargeAt) },
      },
      allow_promotion_codes: allowPromotionCodes,
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
