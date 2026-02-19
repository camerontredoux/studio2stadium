import { type HttpContext } from "@adonisjs/core/http";
import { type NextFn } from "@adonisjs/core/types/http";

export default class PremiumMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const session = ctx.auth.getUserOrFail();

    if (!session.subscribed && session.role !== "admin") {
      return ctx.response.forbidden({
        message: "This feature is only available to premium users.",
      });
    }

    return next();
  }
}
