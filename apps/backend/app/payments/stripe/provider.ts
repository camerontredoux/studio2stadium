import type { ApplicationService } from "@adonisjs/core/types";
import { StripeService, type StripeConfig } from "./service.ts";

declare module "@adonisjs/core/types" {
  interface ContainerBindings {
    stripe: StripeService;
  }
}

export default class StripeProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton("stripe", async () => {
      const config = this.app.config.get<StripeConfig>("stripe");

      if (!config?.apiKey) {
        throw new Error(
          "Stripe API key is required. Set STRIPE_API_KEY in your environment."
        );
      }

      return new StripeService(config);
    });
  }

  async boot() {
    await this.app.container.make("stripe");
  }
}
