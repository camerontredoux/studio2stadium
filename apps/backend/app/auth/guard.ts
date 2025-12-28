import { errors, type symbols } from "@adonisjs/auth";
import type { AuthClientResponse, GuardContract } from "@adonisjs/auth/types";
import type { HttpContext } from "@adonisjs/core/http";
import app from "@adonisjs/core/services/app";
import redis from "@adonisjs/redis/services/main";
import type { RedisGuardOptions, RedisUserProviderContract } from "./types.ts";

export type CookieCachePayload<SessionUser> = {
  user: SessionUser;
  expiresAt: number;
};

export class RedisSessionGuard<
  UserProvider extends RedisUserProviderContract<unknown>,
> implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
  /**
   * Events emitted by the guard (none for this implementation)
   */
  declare [symbols.GUARD_KNOWN_EVENTS]: {};

  /**
   * A unique name for the guard
   */
  #name: string;

  /**
   * Reference to the HTTP context
   */
  #ctx: HttpContext;

  /**
   * Reference to the user provider for database lookups
   */
  #userProvider: UserProvider;

  /**
   * Options for the cookie cache
   */
  #options: RedisGuardOptions;

  /**
   * Driver name for the guard
   */
  driverName: "redis_session" = "redis_session";

  /**
   * Whether authentication has been attempted during this request
   */
  authenticationAttempted: boolean = false;

  /**
   * Whether authentication was via the cookie cache.
   */
  authenticatedViaCookie: boolean = false;

  /**
   * Whether the current request has been authenticated
   */
  isAuthenticated: boolean = false;

  /**
   * Whether the user has been logged out during this request
   */
  isLoggedOut: boolean = false;

  /**
   * Whether the user has been refreshed during this request
   */
  isRefreshed: boolean = false;

  /**
   * The currently authenticated user (exists after authenticate/check)
   */
  user?: UserProvider[typeof symbols.PROVIDER_REAL_USER];

  /**
   * Session key for storing the user ID
   */
  get sessionKeyName() {
    return `auth_${this.#name}`;
  }

  constructor(
    name: string,
    ctx: HttpContext,
    userProvider: UserProvider,
    options: RedisGuardOptions
  ) {
    this.#options = options;
    this.#name = name;
    this.#ctx = ctx;
    this.#userProvider = userProvider;
  }

  #versionKey(userId: string): string {
    return `session:version:${userId}`;
  }

  async #getVersion(userId: string): Promise<number | null> {
    const version = await redis.get(this.#versionKey(userId));
    if (!version) return null;
    return Number.parseInt(version, 10);
  }

  async #bumpVersion(userId: string): Promise<number> {
    const version = Date.now();
    await redis.setex(this.#versionKey(userId), this.#options.sessionAge, version);
    return version;
  }

  async #refreshVersionTtl(userId: string) {
    await redis.expire(this.#versionKey(userId), this.#options.sessionAge);
  }

  async #validateVersion(userId: string, cachedVersion: number): Promise<boolean> {
    const currentVersion = await this.#getVersion(userId);
    return currentVersion === cachedVersion;
  }

  #clearCookieCache() {
    this.#ctx.logger.debug("[RedisGuard]: Clearing cookie cache");
    this.#ctx.response.clearCookie(this.#options.cookieCacheName);
  }

  #getUserFromSession() {
    const user = this.#ctx.session.get("user");
    const version = this.#ctx.session.get("version");
    if (!user || !version) return null;

    return { user, version };
  }

  #putUserInSession(user: UserProvider[typeof symbols.PROVIDER_REAL_USER], version: number) {
    this.#ctx.session.put("user", user as Record<string, unknown>);
    this.#ctx.session.put("version", version);
  }

  #invalidateSession() {
    this.#ctx.logger.debug("[RedisGuard]: Invalidating session");
    this.#ctx.session.clear();

    this.#clearCookieCache();
  }

  #authenticationFailed() {
    this.#ctx.logger.debug(
      `[${this.authenticatedViaCookie ? "CookieGuard" : "RedisGuard"}]: Authentication failed`
    );

    this.isAuthenticated = false;
    this.user = undefined;
    this.isLoggedOut = false;

    return new errors.E_UNAUTHORIZED_ACCESS("Invalid or expired redis user session", {
      guardDriverName: this.driverName,
    });
  }

  #authenticationSucceeded(user: UserProvider[typeof symbols.PROVIDER_REAL_USER]) {
    this.#ctx.logger.debug(
      `[${this.authenticatedViaCookie ? "CookieGuard" : "RedisGuard"}]: Authentication succeeded`
    );

    this.isAuthenticated = true;
    this.user = user;
    this.isLoggedOut = false;
  }

  /**
   * Authenticate via the cookie cache.
   */
  async #authenticateViaCookie() {
    const payload = this.#ctx.request.cookie(this.#options.cookieCacheName) as CookieCachePayload<
      UserProvider[typeof symbols.PROVIDER_REAL_USER]
    > | null;

    if (payload?.user && payload?.expiresAt) {
      if (Date.now() > payload.expiresAt) {
        return this.user;
      }

      this.authenticatedViaCookie = true;
      this.#authenticationSucceeded(payload.user);
    }

    return this.user;
  }

  /**
   * Authenticate via the session cache.
   */
  async #authenticateViaCache(userId: string) {
    const session = this.#getUserFromSession();
    if (!session) return false;

    const user = await this.#userProvider.createUserForGuard(session.user);
    if (user.getId() !== userId) return false;

    const validVersion = await this.#validateVersion(userId, session.version);
    if (!validVersion) return false;

    await this.#refreshVersionTtl(userId);
    this.#authenticationSucceeded(user.getOriginal());
    return true;
  }

  /**
   * Authenticate via the user ID stored in session.
   * First checks the session cache, then falls back to provider.
   */
  async #authenticateViaId(
    userId: string
  ): Promise<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
    if (await this.#authenticateViaCache(userId)) {
      return this.user!;
    }

    const providerUser = await this.#userProvider.findById(userId);
    if (!providerUser) {
      throw this.#authenticationFailed();
    }

    this.#ctx.logger.debug("[RedisGuard]: Updating redis session data");
    const version = (await this.#getVersion(userId)) ?? (await this.#bumpVersion(userId));
    this.#putUserInSession(providerUser.getOriginal(), version);

    this.#authenticationSucceeded(providerUser.getOriginal());
    return this.user!;
  }

  /**
   * Authenticate the current HTTP request by checking the session
   * for a stored user ID.
   */
  async authenticate(): Promise<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
    if (this.authenticationAttempted) {
      return this.getUserOrFail();
    }

    this.authenticationAttempted = true;

    if (this.#ctx.request.method() === "GET") {
      const user = await this.#authenticateViaCookie();
      if (user) return user;
    }

    const authUserId = this.#ctx.session.get(this.sessionKeyName) as string | undefined;
    if (authUserId) {
      return this.#authenticateViaId(authUserId);
    }

    throw this.#authenticationFailed();
  }

  /**
   * Same as authenticate, but returns boolean instead of throwing.
   */
  async check(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch (error) {
      if (error instanceof errors.E_UNAUTHORIZED_ACCESS) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Returns the authenticated user or throws an error.
   */
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
    if (!this.user) {
      throw new errors.E_UNAUTHORIZED_ACCESS("Invalid or expired user session", {
        guardDriverName: this.driverName,
      });
    }
    return this.user;
  }

  setCookieCache(user: UserProvider[typeof symbols.PROVIDER_REAL_USER]) {
    this.#ctx.logger.debug("[RedisGuard]: Setting new cookie cache");

    const payload: CookieCachePayload<UserProvider[typeof symbols.PROVIDER_REAL_USER]> = {
      user,
      expiresAt: Date.now() + this.#options.cookieCacheTtl * 1000,
    };

    this.#ctx.response.cookie(this.#options.cookieCacheName, payload, {
      maxAge: this.#options.cookieCacheTtl,
      httpOnly: true,
      secure: app.inProduction,
      sameSite: "lax",
      path: "/",
    });
  }

  /**
   * Login a user by storing their ID in the session and caching
   * their data for subsequent requests.
   */
  async login(user: UserProvider[typeof symbols.PROVIDER_REAL_USER]) {
    const providerUser = await this.#userProvider.createUserForGuard(user);
    const userId = providerUser.getId();

    this.#ctx.session.put(this.sessionKeyName, userId);
    this.#ctx.session.regenerate();

    const version = await this.#bumpVersion(userId);
    this.#putUserInSession(user, version);

    // Immediately cache user session in cookie on login
    this.setCookieCache(user);

    this.user = user;
    this.isLoggedOut = false;
  }

  /**
   * Logout the user by clearing the session.
   */
  async logout() {
    this.#invalidateSession();

    this.user = undefined;
    this.isAuthenticated = false;
    this.isLoggedOut = true;
    this.isRefreshed = false;
  }

  /**
   * Used by Japa during testing with "loginAs" method.
   */
  async authenticateAsClient(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ): Promise<AuthClientResponse> {
    const providerUser = await this.#userProvider.createUserForGuard(user);
    const userId = providerUser.getId();

    return {
      session: {
        [this.sessionKeyName]: userId,
      },
    };
  }

  /**
   * When making updates to fields in the user's session data,
   * this marks the user's session as stale by bumping the version.
   */
  async refresh() {
    this.#ctx.logger.debug("[RedisGuard]: Invalidating session");

    const user = await this.#userProvider.createUserForGuard(this.getUserOrFail());

    await this.#bumpVersion(user.getId());
    this.#clearCookieCache();

    this.isRefreshed = true;
  }
}
