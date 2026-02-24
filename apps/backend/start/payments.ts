/**
 * Payment service initialization
 *
 * This file preloads the PaymentService to register Stripe webhook event handlers.
 */

import WebhookHandlers from "#modules/webhooks/stripe/handlers";
import app from "@adonisjs/core/services/app";

app.ready(async () => {
  await app.container.make(WebhookHandlers);
});
