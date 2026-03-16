import { db } from "#database/connection";
import { subscriptions } from "#database/schema/subscriptions";
import { and, eq, lt } from "drizzle-orm";

export default class ExpireSubscriptionsService {
  async run() {
    await db
      .update(subscriptions)
      .set({
        status: "canceled",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscriptions.status, "active"),
          lt(subscriptions.currentPeriodEnd, new Date())
        )
      );
  }
}
