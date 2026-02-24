import { db } from "#database/connection";
import { type HttpContext } from "@adonisjs/core/http";
import { type NextFn } from "@adonisjs/core/types/http";

export default class SubscribedMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const session = ctx.auth.getUserOrFail();

    const subscription = await db.query.subscriptions.findFirst({
      where: { userId: session.id, status: "active" },
    });

    const subscribed = !!subscription;

    if (!subscribed && session.role !== "admin") {
      return ctx.response.forbidden({
        message: "This feature is only available to premium users.",
      });
    }

    return next();
  }
}
