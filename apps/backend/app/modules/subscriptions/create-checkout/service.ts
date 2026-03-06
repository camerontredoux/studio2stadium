import stripe from "#payments/stripe/main";
import env from "#start/env";
import { type Validator } from "./validator.ts";

export class Service {
  async execute(userId: string, email: string, payload: Validator) {
    const price =
      payload.type === "monthly"
        ? env.get("STRIPE_PRICE_ID_MONTHLY")
        : env.get("STRIPE_PRICE_ID_YEARLY");

    return await stripe.api.checkout.sessions.create({
      client_reference_id: userId,
      customer_email: email,
      mode: "subscription",
      allow_promotion_codes: true,
      payment_method_types: ["card"],
      ui_mode: "embedded",
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      return_url: `${env.get("SITE_URL")}/settings/membership`,
    });
  }
}
