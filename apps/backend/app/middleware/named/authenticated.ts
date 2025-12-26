import type { Authenticators } from "@adonisjs/auth/types";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

/**
 * Auth middleware is used to authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthenticatedMiddleware {
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[];
    } = {}
  ) {
    /**
     * Authenticate the user using the guards defined in the config/auth.ts file
     *
     * For each guard, the middleware will attempt to authenticate the user using the guard:
     * 1) Get the guard by name
     * 2) Construct the guard instance defined in config/auth.ts
     * 3) Cache and return the guard instance
     * 4) Execute guard.check() which either returns the cached user or gets the session data from the session store
     * 5) If the session exists, get the user id from the session
     * 6) Call guard.authenticateViaId() which calls the SessionUserProvider.findById() method in providers/session-user.ts
     * 7) If found (either from cookie cache or session store), return the user
     * 8) Set ctx.auth.user and ctx.auth.isAuthenticated
     */
    await ctx.auth.authenticateUsing(options.guards);
    return next();
  }
}
