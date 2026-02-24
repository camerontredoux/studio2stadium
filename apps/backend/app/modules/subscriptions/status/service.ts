import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string) {
    const subscription = await this.db.use((db) =>
      db.query.subscriptions.findFirst({
        where: { userId, status: "active" },
      })
    );

    const subscribed = !!subscription;
    const currentPeriodEnd = subscription?.currentPeriodEnd ?? null;
    const cancelAtPeriodEnd = subscription?.cancelAtPeriodEnd ?? false;

    return {
      subscribed,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    };
  }
}
