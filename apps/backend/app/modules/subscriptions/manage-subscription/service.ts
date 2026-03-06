import { DatabaseService } from "#database/service";
import stripe from "#payments/stripe/main";
import env from "#start/env";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}
  async execute(userId: string) {
    const subscription = await this.db.use((db) =>
      db.query.subscriptions.findFirst({
        where: {
          userId,
        },
      })
    );

    if (!subscription) return null;

    const session = await stripe.api.billingPortal.sessions.create({
      customer: subscription.customerId,
      return_url: `${env.get("SITE_URL")}/settings/membership`,
    });

    return {
      url: session.url,
    };
  }
}
