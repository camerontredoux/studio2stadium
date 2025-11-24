import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import { db } from "#database/connection";
import ForbiddenException from "#exceptions/forbidden_exception";

/**
 * Subscribed middleware is used to protect HTTP requests and deny
 * access to users without a valid subscription.
 */
export default class SubscribedMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail();
    const subscription = await db
      .selectFrom("subscriptions")
      .select(["current_period_end", "canceled_at", "cancel_at_period_end"])
      .where("user_id", "=", user.id)
      .executeTakeFirst();

    if (!subscription) {
      throw new ForbiddenException("No active subscription found.");
    }

    if (subscription.canceled_at) {
      throw new ForbiddenException("Subscription has been cancelled.");
    }

    if (subscription.current_period_end && subscription.current_period_end <= new Date()) {
      throw new ForbiddenException("Subscription is expired.");
    }

    return next();
  }
}
