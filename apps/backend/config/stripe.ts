import { defineConfig } from "#payments/stripe/service";
import env from "#start/env";

export default defineConfig({
  apiKey: env.get("STRIPE_API_KEY"),
  webhookSecret: env.get("STRIPE_WEBHOOK_SECRET"),
});
