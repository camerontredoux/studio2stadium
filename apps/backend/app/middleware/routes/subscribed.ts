import { db } from "#database/connection";
import { subscriptions } from "#database/schema/subscriptions";
import { type HttpContext } from "@adonisjs/core/http";
import { type NextFn } from "@adonisjs/core/types/http";
import { and, eq, gt } from "drizzle-orm";

export default class SubscribedMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const session = ctx.auth.getUserOrFail();

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

    const subscribed = !!subscription;

    if (!subscribed && session.role !== "admin") {
      return ctx.response.forbidden({
        message: "This feature is only available to premium users.",
      });
    }

    return next();
  }
}
