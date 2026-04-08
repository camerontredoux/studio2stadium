import { db } from "#database/connection";
import { subscriptions } from "#database/schema/subscriptions";
import { premiumGrants } from "#database/schema/organizations";
import { type HttpContext } from "@adonisjs/core/http";
import { type NextFn } from "@adonisjs/core/types/http";
import { and, eq, gt, isNull } from "drizzle-orm";

/**
 * Grants access when the authenticated user has premium entitlement from any
 * of the following sources:
 *
 *   1. Superadmin role (users.role === "admin")
 *   2. An active Stripe/RevenueCat subscription in user_subscriptions
 *   3. An active, unrevoked premium_grants row (expires_at in the future)
 *
 * Otherwise responds 403.
 */
export default class SubscribedMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const session = ctx.auth.getUserOrFail();

    if (session.role === "admin") {
      return next();
    }

    const [subscription] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.id),
          eq(subscriptions.status, "active"),
          gt(subscriptions.currentPeriodEnd, new Date())
        )
      )
      .limit(1);
    if (subscription) {
      return next();
    }

    const [grant] = await db
      .select({ id: premiumGrants.id })
      .from(premiumGrants)
      .where(
        and(
          eq(premiumGrants.userId, session.id),
          gt(premiumGrants.expiresAt, new Date()),
          isNull(premiumGrants.revokedAt)
        )
      )
      .limit(1);
    if (grant) {
      return next();
    }

    return ctx.response.forbidden({
      message: "This feature is only available to premium users.",
    });
  }
}
