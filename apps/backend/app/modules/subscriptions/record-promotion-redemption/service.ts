import { promotionCodeRedemptions } from "#database/schema/promotion-redemptions";
import { DatabaseService } from "#database/service";
import stripe from "#payments/stripe/main";
import { inject } from "@adonisjs/core";
import logger from "@adonisjs/core/services/logger";
import { and, eq, inArray } from "drizzle-orm";
import { type Stripe } from "stripe";

/**
 * Promotion codes each S2S account may redeem only once, ever, whatever plan
 * or how many times it subscribes. Upper case: Stripe matches codes without
 * regard to case.
 */
export const ONCE_PER_ACCOUNT_CODES: readonly string[] = ["S2SSAVE"];

type SessionDiscounts = Partial<Pick<Stripe.Checkout.Session, "discounts">>;

/**
 * Records that an account redeemed a once-per-account promotion code on a
 * completed Dancer checkout, and tells checkout whether it already has.
 * Recording is idempotent: the webhook and the Dancer's return both fulfil a
 * session, and Stripe redelivers events.
 */
@inject()
export class PromotionRedemptionService {
  constructor(private db: DatabaseService) {}

  /** Whether the account has redeemed any once-per-account code. */
  async hasRedeemed(userId: string) {
    const [row] = await this.db.use((db) =>
      db
        .select({ id: promotionCodeRedemptions.id })
        .from(promotionCodeRedemptions)
        .where(
          and(
            eq(promotionCodeRedemptions.userId, userId),
            inArray(promotionCodeRedemptions.code, [...ONCE_PER_ACCOUNT_CODES])
          )
        )
        .limit(1)
    );
    return Boolean(row);
  }

  async record(userId: string, session: { id: string } & SessionDiscounts) {
    for (const discount of session.discounts ?? []) {
      const promotion = discount.promotion_code;
      if (!promotion) continue;

      const { id: promotionCodeId, code } =
        typeof promotion === "string"
          ? await stripe.api.promotionCodes.retrieve(promotion)
          : promotion;
      const normalized = code.toUpperCase();
      if (!ONCE_PER_ACCOUNT_CODES.includes(normalized)) continue;

      const [inserted] = await this.db.use((db) =>
        db
          .insert(promotionCodeRedemptions)
          .values({
            userId,
            code: normalized,
            promotionCodeId,
            checkoutSessionId: session.id,
          })
          .onConflictDoNothing()
          .returning({ id: promotionCodeRedemptions.id })
      );
      if (inserted) continue;

      // Already recorded: the same session fulfilled twice is expected. A
      // different session means the code got through a second time, from a
      // checkout opened before the first redemption was recorded.
      const [existing] = await this.db.use((db) =>
        db
          .select({
            checkoutSessionId: promotionCodeRedemptions.checkoutSessionId,
          })
          .from(promotionCodeRedemptions)
          .where(
            and(
              eq(promotionCodeRedemptions.userId, userId),
              eq(promotionCodeRedemptions.code, normalized)
            )
          )
      );
      if (existing && existing.checkoutSessionId !== session.id) {
        logger.warn(
          {
            userId,
            code: normalized,
            checkoutSessionId: session.id,
            firstCheckoutSessionId: existing.checkoutSessionId,
          },
          "Once-per-account promotion code redeemed again"
        );
      }
    }
  }
}
