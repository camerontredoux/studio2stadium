import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Admin middleware ensures the authenticated user has admin privileges.
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail();

    if (user.role !== "admin") {
      return ctx.response.forbidden({
        message: "This resource is only available to admins.",
      });
    }

    await next();
  }
}
