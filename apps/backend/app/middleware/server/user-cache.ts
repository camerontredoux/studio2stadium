import { sessionCache } from "#utils/cookie-cache";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * User cache middleware reads the signed user cache cookie
 * and sets ctx.cachedUser if valid, allowing SessionUserProvider
 * to skip external calls.
 */
export default class UserCacheMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const cachedCookie = sessionCache.readCookie(ctx);
    if (cachedCookie) {
      console.group("Cached Cookie");
      console.log("Cached Cookie Parsed", JSON.parse(cachedCookie));
      const payload = sessionCache.verifyCookieValue(cachedCookie);
      if (payload) {
        console.log("Payload", payload);
        ctx.cachedUser = payload;
      }
      console.groupEnd();
    }

    const result = await next();

    // After request, if user was authenticated and cache wasn't used,
    // refresh the cookie cache
    if (ctx.auth?.user && !ctx.usedCachedUser) {
      ctx.logger.info("Refreshed cookie cache");
      sessionCache.setCookie(ctx, ctx.auth.user);
    }

    return result;
  }
}
