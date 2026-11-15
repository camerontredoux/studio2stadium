import { E_NOT_FOUND } from "#exceptions/not-found";
import { FulfillCheckoutService } from "#modules/subscriptions/fulfill-checkout/service";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import stripe from "#payments/stripe/main";
import { inject } from "@adonisjs/core";
import { HttpContext } from "@adonisjs/core/http";
import Stripe from "stripe";
import { schema } from "./validator.ts";

/**
 * The Dancer is back from Stripe Checkout. Fulfil the session now rather than
 * wait for the webhook, then return the Dancer's plan. Stripe is asked for the
 * session, so the client's word is never taken for a payment.
 */
export default class ConfirmCheckoutController {
  @inject()
  async handle(
    ctx: HttpContext,
    fulfill: FulfillCheckoutService,
    subscriptions: GetSubscriptionService
  ) {
    const user = ctx.auth.getUserOrFail();
    const { sessionId } = await ctx.request.validateUsing(schema);

    // An unknown id is a 404; any other Stripe failure is a 500, since the
    // webhook still fulfils the purchase.
    const session = await stripe.api.checkout.sessions
      .retrieve(sessionId)
      .catch((error: unknown) => {
        if (error instanceof Stripe.errors.StripeInvalidRequestError) {
          return null;
        }
        throw error;
      });

    if (!session || session.client_reference_id !== user.id) {
      throw new E_NOT_FOUND("Checkout session not found");
    }

    if (session.status === "complete") {
      await fulfill.execute(session);
    }

    return ctx.response.ok(await subscriptions.execute(user.id));
  }
}
