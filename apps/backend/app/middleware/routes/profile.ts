import "#auth/session";
import type { ProfileSession } from "#auth/session";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Profile middleware ensures the authenticated user has a profile (any type).
 * Sets ctx.session with typed ProfileSession for use in controllers.
 * Use this for type-agnostic routes that need profileId.
 */
export default class ProfileMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail();
    if (!user.profileId) {
      return ctx.response.forbidden({
        message: "This resource requires a profile.",
      });
    }

    ctx.session = user as ProfileSession;
    await next();
  }
}
