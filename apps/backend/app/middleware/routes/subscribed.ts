import { DatabaseService } from "#database/service";
import { GetSubscriptionService } from "#modules/subscriptions/get-status/service";
import { type HttpContext } from "@adonisjs/core/http";
import { type NextFn } from "@adonisjs/core/types/http";

/**
 * Grants access when the authenticated user is a superadmin
 * (users.role === "admin") or has paid access: an active subscription, an
 * active premium grant, or a running 1-Week Pass. With `premium: true` the
 * Week Pass is not enough; the route needs full Premium.
 *
 * Otherwise responds 403.
 */
export default class SubscribedMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: { premium?: boolean } = {}
  ) {
    const session = ctx.auth.getUserOrFail();

    if (session.role === "admin") {
      return next();
    }

    const status = await new GetSubscriptionService(
      new DatabaseService()
    ).execute(session.id);

    if (options.premium ? status.access === "premium" : status.subscribed) {
      return next();
    }

    return ctx.response.forbidden({
      message: options.premium
        ? "This feature needs a Monthly, Season Pass, or Annual plan."
        : "This feature is only available to premium users.",
    });
  }
}
