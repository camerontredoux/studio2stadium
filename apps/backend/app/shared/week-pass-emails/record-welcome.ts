import { weekPassEmails } from "#database/schema/week-pass-emails";
import type { Transaction } from "#database/service";
import { weekPassEmailConfig } from "./config.ts";

export interface WelcomeObligation {
  userId: string;
  checkoutSessionId: string;
  weekPassId: string;
  now: Date;
}

/**
 * Owe a welcome email for a pass just recorded, inside the transaction that
 * recorded it: the pass and the obligation commit or roll back together.
 * Nothing is sent here; the Week Pass email job delivers it after commit.
 * Records nothing unless the welcome email is active and the purchase is at
 * or after the activation cutoff.
 */
export class RecordWeekPassWelcome {
  async execute(tx: Transaction, obligation: WelcomeObligation) {
    const config = weekPassEmailConfig();
    if (
      !config.welcome.active ||
      !config.activeFrom ||
      obligation.now < config.activeFrom
    ) {
      return false;
    }

    await tx
      .insert(weekPassEmails)
      .values({
        kind: "welcome",
        dedupeKey: obligation.checkoutSessionId,
        userId: obligation.userId,
        weekPassId: obligation.weekPassId,
      })
      .onConflictDoNothing();
    return true;
  }
}
