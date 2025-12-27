import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Auth middleware is used to authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthenticatedMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.authenticateUsing();

    await next();

    const guard = ctx.auth.use("redis");
    if (guard.isAuthenticated && !guard.isRefreshed && !guard.authenticationViaCookie) {
      guard.setCookieCache(guard.getUserOrFail());
    }
  }
}
