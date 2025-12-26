import { symbols } from "@adonisjs/auth";
import {
  type SessionGuardUser,
  type SessionUserProviderContract,
} from "@adonisjs/auth/types/session";
import type { HttpContext } from "@adonisjs/core/http";
import redis from "@adonisjs/redis/services/main";
import { AuthQueries } from "../queries.ts";

export type SessionUser = NonNullable<Awaited<ReturnType<AuthQueries["findUserWithRoles"]>>>;

export class SessionUserProvider implements SessionUserProviderContract<SessionUser> {
  declare [symbols.PROVIDER_REAL_USER]: SessionUser;

  #ctx: HttpContext;

  #queries: AuthQueries;

  #versionKey(userId: string): string {
    return `user:${userId}:version`;
  }

  #getUserFromSession() {
    const user = this.#ctx.session.get("user") as SessionUser | undefined;
    const version = this.#ctx.session.get("version") as number | undefined;
    if (!user || !version) return null;
    return { user, version };
  }

  async #validateVersion(userId: string, cachedVersion: number): Promise<boolean> {
    const currentVersion = await this.#getVersion(userId);
    if (currentVersion === null) {
      await this.#setVersion(userId, cachedVersion);
      return true;
    }
    return currentVersion === cachedVersion;
  }

  async #getVersion(userId: string): Promise<number | null> {
    const version = await redis.get(this.#versionKey(userId));
    if (!version) return null;
    return Number.parseInt(version, 10);
  }

  /**
   * Set or update the cache version for a user.
   */
  async #setVersion(userId: string, version: number): Promise<void> {
    await redis.set(this.#versionKey(userId), version);
  }

  /**
   * Bump the cache version to invalidate existing cookie caches.
   * Returns the new version.
   */
  async #bumpVersion(userId: string): Promise<number> {
    const newVersion = Date.now();
    await this.#setVersion(userId, newVersion);
    return newVersion;
  }

  /**
   * Store user and version in the session.
   */
  #setUserInSession(user: SessionUser, version: number) {
    this.#ctx.session.put("user", user);
    this.#ctx.session.put("version", version);
  }

  constructor(ctx: HttpContext) {
    this.#ctx = ctx;
    this.#queries = new AuthQueries(ctx);
  }

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
    const sessionData = this.#getUserFromSession();
    if (sessionData && sessionData.user.id === identifier) {
      const isValid = await this.#validateVersion(identifier, sessionData.version);
      if (isValid) {
        this.#ctx.logger.debug("[CACHE]: Hit - Session store");
        return this.createUserForGuard(sessionData.user);
      }
    }

    this.#ctx.logger.debug("[CACHE]: Miss - Performing database query for user");
    const user = await this.#queries.findUserWithRoles(identifier);
    if (!user) {
      return null;
    }

    this.#ctx.logger.debug("[CACHE]: Update - Session store");
    const version = await this.#bumpVersion(identifier);
    this.#setUserInSession(user, version);

    return this.createUserForGuard(user);
  }
}
