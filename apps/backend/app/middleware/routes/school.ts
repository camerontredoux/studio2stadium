import "#auth/session";
import type { ProfileSession } from "#auth/session";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * School middleware ensures the authenticated user is a school with a profile.
 * Sets ctx.session with typed ProfileSession for use in controllers.
 */
export default class SchoolMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail();

    if (user.type !== "school") {
      return ctx.response.forbidden({
        message: "This resource is only available to schools.",
      });
    }

    if (!user.profileId) {
      return ctx.response.forbidden({
        message: "This resource requires a profile.",
      });
    }

    ctx.session = user as ProfileSession;
    await next();
  }
}
