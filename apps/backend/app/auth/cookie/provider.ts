import { sessionCache } from "#utils/cookie-cache";
import { UserQueries } from "#utils/user-queries";
import { symbols } from "@adonisjs/auth";
import {
  type SessionGuardUser,
  type SessionUserProviderContract,
} from "@adonisjs/auth/types/session";
import { HttpContext } from "@adonisjs/core/http";

export type SessionUser = NonNullable<Awaited<ReturnType<typeof UserQueries.findWithRoles>>>;

export class SessionUserProvider implements SessionUserProviderContract<SessionUser> {
  declare [symbols.PROVIDER_REAL_USER]: SessionUser;

  async createUserForGuard(user: SessionUser): Promise<SessionGuardUser<SessionUser>> {
    return {
      getId() {
        return user.id;
      },
      getOriginal() {
        return user;
      },
    };
  }

  async findById(identifier: string): Promise<SessionGuardUser<SessionUser> | null> {
    const ctx = HttpContext.getOrFail();

    if (ctx.cachedUser && ctx.cachedUser.id === identifier) {
      ctx.logger.debug("[CACHE]: Hit - Cookie cache");
      ctx.usedCachedUser = true;
      return this.createUserForGuard(ctx.cachedUser);
    }

    const sessionData = sessionCache.getUserFromSession(ctx);
    if (sessionData && sessionData.user.id === identifier) {
      const isValid = await sessionCache.validateVersion(identifier, sessionData.version);
      if (isValid) {
        ctx.logger.debug("[CACHE]: Hit - Session store");
        return this.createUserForGuard(sessionData.user);
      }
    }

    ctx.logger.debug("[CACHE]: Miss - Performing database query for user");
    const user = await UserQueries.findWithRoles(identifier);
    if (!user) {
      return null;
    }

    const version = await sessionCache.bumpVersion(identifier);
    ctx.logger.debug("[CACHE]: Update - Session store");
    sessionCache.setUserInSession(ctx, user, version);

    return this.createUserForGuard(user);
  }
}
