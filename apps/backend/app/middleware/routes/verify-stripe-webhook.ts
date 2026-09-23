import type { StripeConfig } from "#payments/stripe/service";
import type { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";
import type { NextFn } from "@adonisjs/core/types/http";
import * as Sentry from "@sentry/node";
import type Stripe from "stripe";

/**
 * Middleware to verify Stripe webhook signatures and dispatch events
 */
export default class VerifyStripeWebhookMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const config = app.config.get<StripeConfig>("stripe");

    if (!config?.webhookSecret) {
      ctx.logger.error("Stripe webhook secret is not configured");
      return ctx.response.badRequest({
        error: "Webhook secret not configured",
      });
    }

    const signature = ctx.request.header("stripe-signature");

    if (!signature) {
      return ctx.response.badRequest({
        error: "Missing stripe-signature header",
      });
    }

    const stripe = await app.container.make("stripe");

    // Get the raw body - AdonisJS stores it on the request
    const rawBody = ctx.request.raw();

    if (!rawBody) {
      return ctx.response.badRequest({ error: "Missing request body" });
    }

    let event: Stripe.Event;

    try {
      event = stripe.constructEvent(rawBody, signature, config.webhookSecret);
    } catch (error) {
      ctx.logger.error(
        { err: error },
        "Stripe webhook signature verification failed"
      );
      return ctx.response.badRequest({ error: "Invalid signature" });
    }

    // Dispatch to registered handlers. A verified event whose handler fails is
    // a server error, not a bad signature: it is reported, and the non-2xx
    // answer makes Stripe retry it and show it as a failed delivery.
    try {
      await stripe.dispatchEvent(event);
    } catch (error) {
      Sentry.captureException(error, {
        extra: { eventId: event.id, eventType: event.type },
      });
      return ctx.response.internalServerError({
        error: "Webhook handler failed",
      });
    }

    return next();
  }
}
