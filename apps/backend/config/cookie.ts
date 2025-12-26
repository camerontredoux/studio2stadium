import type { SessionUser } from "../app/auth/redis/provider.ts";

/**
 * Augment HttpContext with user cache properties
 */
declare module "@adonisjs/core/http" {
  interface HttpContext {
    /**
     * Cached user from signed cookie (set by UserCacheMiddleware)
     */
    cachedUser?: SessionUser;

    /**
     * Flag indicating if cached user was used (skipped provider lookup)
     */
    usedCachedUser?: boolean;
  }
}
