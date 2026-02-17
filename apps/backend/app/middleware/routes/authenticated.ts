import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Auth middleware authenticates HTTP requests and denies access to
 * unauthenticated users. Does not set ctx.session - use dancer(),
 * school(), or profile() middleware to access typed session.
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
