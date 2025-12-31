import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Auth middleware is used to authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthenticatedMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.response.header("cache-control", "private, no-store");

    await ctx.auth.authenticateUsing();

    await next();

    const guard = ctx.auth.use("redis");
    if (guard.isAuthenticated && !guard.authenticatedViaCookie) {
      guard.setSessionCookie();

      if (!guard.isRefreshed) {
        guard.setCacheCookie();
      }
    }
  }
}
