import type { SessionUser } from "#auth/redis/provider";
import { MessageBuilder } from "@adonisjs/core/helpers";
import type { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";
import redis from "@adonisjs/redis/services/main";

/**
 * Centralized service for all user cache operations.
 * Handles cookie signing/verification and Redis cache management.
 */
class SessionCache {
  #messageBuilder: MessageBuilder;

  #cookieName: string;
  #cookieTtl: number;

  constructor() {
    this.#messageBuilder = new MessageBuilder();
    this.#cookieName = "cookie_cache";
    this.#cookieTtl = 5 * 60;
  }

  // ============================================
  // Cookie Operations
  // ============================================

  /**
   * Read and verify the user cache cookie from the request.
   * Returns the payload if valid, null otherwise.
   */
  readCookie(ctx: HttpContext): string | null {
    return ctx.request.cookie(this.#cookieName);
  }

  /**
   * Set the user cache cookie on the response.
   */
  setCookie(ctx: HttpContext, user: SessionUser): void {
    const cookieValue = this.buildCookieValue(user);
    ctx.response.cookie(this.#cookieName, cookieValue, {
      maxAge: this.#cookieTtl,
      httpOnly: true,
      secure: app.inProduction,
      sameSite: "lax",
      path: "/",
    });
  }

  verifyCookieValue(cookieValue: string): SessionUser | null {
    try {
      return this.#messageBuilder.verify<SessionUser>(cookieValue, this.#cookieName);
    } catch {
      return null;
    }
  }

  /**
   * Clear the user cache cookie.
   */
  clearCookie(ctx: HttpContext): void {
    ctx.response.clearCookie(this.#cookieName);
  }

  // ============================================
  // Session Cache Operations
  // ============================================

  /**
   * Uses the Redis session store to get the cached user and version.
   */
  getUserFromSession(ctx: HttpContext) {
    const user = ctx.session.get("user") as SessionUser | undefined;
    const version = ctx.session.get("version") as number | undefined;
    if (!user || !version) return null;
    return { user, version };
  }

  /**
   * Store user and version in the session.
   */
  setUserInSession(ctx: HttpContext, user: SessionUser, version: number) {
    ctx.session.put("user", user);
    ctx.session.put("version", version);
  }

  /**
   * Clear user data from the session.
   */
  clearUserFromSession(ctx: HttpContext) {
    ctx.session.forget("user");
    ctx.session.forget("version");
  }

  // ============================================
  // Version Operations (for cache invalidation)
  // ============================================

  /**
   * Get the current cache version for a user.
   * Returns null if no version exists.
   */
  async getVersion(userId: string): Promise<number | null> {
    const version = await redis.get(this.versionKey(userId));
    if (!version) return null;
    return Number.parseInt(version, 10);
  }

  /**
   * Set or update the cache version for a user.
   */
  async setVersion(userId: string, version: number): Promise<void> {
    await redis.set(this.versionKey(userId), version);
  }

  /**
   * Bump the cache version to invalidate existing cookie caches.
   * Returns the new version.
   */
  async bumpVersion(userId: string): Promise<number> {
    const newVersion = Date.now();
    await this.setVersion(userId, newVersion);
    return newVersion;
  }

  /**
   * Validate that a cached version matches the current version.
   */
  async validateVersion(userId: string, cachedVersion: number): Promise<boolean> {
    const currentVersion = await this.getVersion(userId);
    if (currentVersion === null) {
      // No version exists, set it and consider valid
      await this.setVersion(userId, cachedVersion);
      return true;
    }
    return currentVersion === cachedVersion;
  }

  /**
   * Delete the version key for a user.
   */
  async deleteVersion(userId: string): Promise<void> {
    await redis.del(this.versionKey(userId));
  }

  // ============================================
  // High-level Operations
  // ============================================

  /**
   * Initialize cache for a user (e.g., after login).
   * Sets both session cache and cookie.
   */
  async initializeCache(ctx: HttpContext, user: SessionUser): Promise<void> {
    const version = await this.bumpVersion(user.id);
    this.setUserInSession(ctx, user, version);
    this.setCookie(ctx, user);
  }

  /**
   * Clear all caches for a user (e.g., on logout).
   */
  async clearAllCaches(ctx: HttpContext, userId: string): Promise<void> {
    this.clearUserFromSession(ctx);
    await this.deleteVersion(userId);
    this.clearCookie(ctx);
  }

  /**
   * Invalidate user cache (e.g., after profile/role update).
   * Bumps version to invalidate cookies. Session data will be
   * refreshed on next request when version check fails.
   */
  async invalidate(userId: string): Promise<void> {
    await this.bumpVersion(userId);
  }

  /**
   * Refresh the cookie cache after a successful auth.
   */
  async refreshCookie(ctx: HttpContext, user: SessionUser): Promise<void> {
    let version = await this.getVersion(user.id);
    if (version === null) {
      version = await this.bumpVersion(user.id);
    }
    this.setCookie(ctx, user);
  }

  // ============================================
  // Private Helpers
  // ============================================

  private buildCookieValue(user: SessionUser): string {
    const message = this.#messageBuilder.build(user, this.#cookieTtl * 1000, this.#cookieName);
    return message;
  }

  private versionKey(userId: string): string {
    return `user:${userId}:version`;
  }
}

export const sessionCache = new SessionCache();
