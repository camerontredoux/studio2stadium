import app from "@adonisjs/core/services/app";
import { type StripeService } from "./service.ts";

let stripe: StripeService;

await app.booted(async () => {
  stripe = await app.container.make("stripe");
});

export { stripe as default };
