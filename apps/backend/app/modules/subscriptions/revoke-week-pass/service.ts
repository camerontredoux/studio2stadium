import { weekPasses } from "#database/schema/subscriptions";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, eq, isNull, sql } from "drizzle-orm";

export interface RevokedWeekPass {
  id: string;
  userId: string;
}

/**
 * End the 1-Week Pass bought with a payment that was fully refunded or
 * disputed. Only that pass changes: a subscription, a premium grant or any
 * other pass on the account keeps running. A running pass ends now; a pass
 * stacked to start later never starts. Repeating it changes nothing, so a
 * redelivered webhook is safe.
 */
@inject()
export class RevokeWeekPassService {
  constructor(private db: DatabaseService) {}

  async execute(paymentIntentId: string): Promise<RevokedWeekPass | null> {
    const [revoked] = await this.db.use((db) =>
      db
        .update(weekPasses)
        .set({
          revokedAt: sql`now()`,
          endsAt: sql`least(${weekPasses.endsAt}, greatest(${weekPasses.startsAt}, now()))`,
          updatedAt: sql`now()`,
        })
        .where(
          and(
            eq(weekPasses.paymentIntentId, paymentIntentId),
            isNull(weekPasses.revokedAt)
          )
        )
        .returning({ id: weekPasses.id, userId: weekPasses.userId })
    );

    return revoked ?? null;
  }
}
