import { errors, type symbols } from "@adonisjs/auth";
import type { AuthClientResponse, GuardContract } from "@adonisjs/auth/types";
import { MessageBuilder } from "@adonisjs/core/helpers";
import type { HttpContext } from "@adonisjs/core/http";
import redis from "@adonisjs/redis/services/main";
import type { Connection } from "@adonisjs/redis/types";
import { randomUUID } from "node:crypto";
import type { RedisGuardOptions, RedisUserProviderContract } from "./types.ts";

export type SessionData<SessionUser> = {
  version: number;
  user: SessionUser;
};

export type CookieCachePayload<SessionUser> = {
  user: SessionUser;
  expiresAt: number;
};

export class RedisSessionGuard<
  User,
  UserProvider extends RedisUserProviderContract<User> =
    RedisUserProviderContract<User>,
> implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
  /**
   * Events emitted by the guard (none for this implementation)
   */
  declare [symbols.GUARD_KNOWN_EVENTS]: {};

  /**
   * Reference to the Redis connection
   */
  #connection: Connection;

  /**
   * Session ID from the session cookie
   */
  #sessionId: string;

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
  user?: User;

  constructor(
    ctx: HttpContext,
    userProvider: UserProvider,
    options: RedisGuardOptions
  ) {
    this.#options = options;
    this.#ctx = ctx;
    this.#userProvider = userProvider;
    this.#connection = redis.connection("session");
    this.#sessionId = ctx.request.cookie(options.sessionCookieName);
  }

  #versionKey(userId: string): string {
    return `version:${userId}`;
  }

  async #getVersion(userId: string): Promise<number> {
    const version = await this.#connection.get(this.#versionKey(userId));
    if (!version) return await this.#bumpVersion(userId);
    return Number.parseInt(version, 10);
  }

  async #bumpVersion(userId: string): Promise<number> {
    const version = Date.now();
    await this.#connection.setex(
      this.#versionKey(userId),
      this.#options.sessionAge,
      version
    );
    return version;
  }

  async #refreshSession() {
    await this.#connection.expire(this.#sessionId, this.#options.sessionAge);
  }

  async #commitSession(session: SessionData<User>, login: boolean = false) {
    // Regenerate the session ID to prevent session fixation attacks
    if (login) {
      this.#sessionId = randomUUID();
    }

    const message = new MessageBuilder().build(
      session,
      undefined,
      this.#sessionId
    );
    await this.#connection.setex(
      this.#sessionId,
      this.#options.sessionAge,
      message
    );
  }

  async #validateVersion(userId: string, cachedVersion: number) {
    const version = await this.#getVersion(userId);
    return { valid: version === cachedVersion, version };
  }

  #clearSessionCookie() {
    this.#ctx.logger.debug("[RedisGuard]: Clearing session cookie");
    this.#ctx.response.clearCookie(this.#options.sessionCookieName);
  }

  #clearCacheCookie() {
    this.#ctx.logger.debug("[RedisGuard]: Clearing cache cookie");
    this.#ctx.response.clearCookie(this.#options.cacheCookieName);
  }

  #authenticationFailed() {
    const guardName = this.authenticatedViaCookie
      ? "CookieGuard"
      : "RedisGuard";
    this.#ctx.logger.debug(`[${guardName}]: Authentication failed`, {
      sessionId: this.#sessionId,
    });

    this.isAuthenticated = false;
    this.user = undefined;
    this.isLoggedOut = false;

    this.#clearSessionCookie();
    this.#clearCacheCookie();

    return new errors.E_UNAUTHORIZED_ACCESS("Invalid or expired user session", {
      guardDriverName: this.driverName,
    });
  }

  async #authenticationSucceeded(user: User) {
    const sessionType = this.authenticatedViaCookie
      ? "CookieGuard"
      : "RedisGuard";
    this.#ctx.logger.debug(`[${sessionType}]: Authentication succeeded`);

    this.isAuthenticated = true;
    this.isLoggedOut = false;
    this.user = user;
  }

  /**
   * Authenticate via the cookie cache.
   */
  async #authenticateViaCookie() {
    const payload: CookieCachePayload<User> | null = this.#ctx.request.cookie(
      this.#options.cacheCookieName
    );

    if (!payload) {
      return null;
    }

    // Check if the cookie cache has expired for clients that always send the cache cookie
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    this.authenticatedViaCookie = true;

    await this.#authenticationSucceeded(payload.user);

    return this.user;
  }

  /**
   * Parses the session data from the Redis session
   * @throws {errors.E_UNAUTHORIZED_ACCESS} if the session data is corrupted
   */
  #parseSessionData(
    content: string,
    sessionId: string
  ): SessionData<User> | null {
    try {
      return new MessageBuilder().verify<SessionData<User>>(content, sessionId);
    } catch {
      this.#ctx.logger.debug("[RedisGuard]: Invalid session data", {
        content,
        sessionId,
      });
      throw new errors.E_UNAUTHORIZED_ACCESS("Session data corrupted", {
        guardDriverName: this.driverName,
      });
    }
  }

  /**
   * Gets the user from the session and parses their session data.
   *
   * @throws {errors.E_UNAUTHORIZED_ACCESS} if the session is invalid or expired
   */
  async #getUserFromSession(): Promise<SessionData<User> | null> {
    const content = await this.#connection.get(this.#sessionId);
    if (!content) throw this.#authenticationFailed();

    return this.#parseSessionData(content, this.#sessionId);
  }

  /**
   * Authenticate via the Redis session.
   */
  async #authenticateViaRedis() {
    const session = await this.#getUserFromSession();
    if (!session) throw this.#authenticationFailed();

    const cachedUser = await this.#userProvider.createUserForGuard(
      session.user
    );

    const userId = cachedUser.getId();
    const { version, valid } = await this.#validateVersion(
      userId,
      session.version
    );

    if (valid) {
      await this.#authenticationSucceeded(session.user);
      await this.#refreshSession();
    }

    return { valid, userId, version };
  }

  /**
   * Authenticate via the Redis session.
   */
  async #authenticateViaDatabase(userId: string, version: number) {
    const user = await this.#userProvider.findById(userId);
    if (!user) {
      throw this.#authenticationFailed();
    }

    this.#ctx.logger.debug("[DatabaseGuard]: Updating session", {
      userId,
      sessionId: this.#sessionId,
    });

    await this.#commitSession({ version, user: user.getOriginal() });
    await this.#authenticationSucceeded(user.getOriginal());
  }

  /**
   * Authenticate via the user ID stored in session.
   * First checks the session cache, then falls back to provider.
   */
  async #authenticateViaId(): Promise<User> {
    const { valid, userId, version } = await this.#authenticateViaRedis();

    if (!valid) {
      await this.#authenticateViaDatabase(userId, version);
    }

    return this.user!;
  }

  /**
   * Authenticate the current HTTP request by checking the session
   * for a stored user ID.
   */
  async authenticate(): Promise<User> {
    if (!this.#sessionId) {
      throw this.#authenticationFailed();
    }

    if (this.authenticationAttempted) {
      return this.getUserOrFail();
    }

    this.authenticationAttempted = true;

    if (this.#ctx.request.method() === "GET") {
      const user = await this.#authenticateViaCookie();
      if (user) return user;
    }

    return this.#authenticateViaId();
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
      throw new errors.E_UNAUTHORIZED_ACCESS(
        "Invalid or expired user session",
        {
          guardDriverName: this.driverName,
        }
      );
    }
    return this.user;
  }

  setSessionCookie() {
    this.#ctx.logger.debug("[AuthGuard]: Setting new session cookie");

    this.#ctx.response.cookie(
      this.#options.sessionCookieName,
      this.#sessionId,
      this.#options.cookieOptions(this.#options.sessionAge)
    );
  }

  setCacheCookie() {
    this.#ctx.logger.debug("[AuthGuard]: Setting new cache cookie");

    /**
     * Need expiresAt to force the client to refresh the cache cookie
     * This is a workaround for clients that send the (expired) cache cookie on every request
     */
    const payload: CookieCachePayload<User> = {
      user: this.getUserOrFail(),
      expiresAt: Date.now() + this.#options.cacheCookieAge * 1000,
    };

    this.#ctx.response.cookie(
      this.#options.cacheCookieName,
      payload,
      this.#options.cookieOptions(this.#options.cacheCookieAge)
    );
  }

  /**
   * Login a user by storing their ID in the session and caching
   * their data for subsequent requests.
   */
  async login(user: User) {
    if (this.#sessionId) {
      this.#ctx.logger.debug("[LoginGuard] Deleting existing session");
      await this.#connection.del(this.#sessionId);
    }
    const providerUser = await this.#userProvider.createUserForGuard(user);

    this.user = user;
    this.isLoggedOut = false;
    this.isAuthenticated = true;
    this.isRefreshed = false;

    const version = await this.#bumpVersion(providerUser.getId());
    const session = { version, user: providerUser.getOriginal() };
    await this.#commitSession(session, true);

    this.setSessionCookie();
    this.setCacheCookie();
  }

  /**
   * Logout the user by clearing the session.
   */
  async logout() {
    this.#ctx.logger.debug("[RedisGuard]: Deleting session");

    await this.#connection.del(this.#sessionId);
    this.#clearSessionCookie();
    this.#clearCacheCookie();

    this.user = undefined;
    this.isAuthenticated = false;
    this.isLoggedOut = true;
    this.isRefreshed = false;
  }

  /**
   * When making updates to fields in the user's session data,
   * this marks the user's session as stale by bumping the version.
   */
  async refresh() {
    this.#ctx.logger.debug("[RedisGuard]: Invalidating session");

    const user = await this.#userProvider.createUserForGuard(this.user!);

    await this.#bumpVersion(user.getId());
    this.#clearCacheCookie();

    this.isRefreshed = true;
  }

  /**
   * Used by Japa during testing with "loginAs" method.
   * TODO: Ignore this method for now, not implemented properly.
   */
  async authenticateAsClient(user: User): Promise<AuthClientResponse> {
    const providerUser = await this.#userProvider.createUserForGuard(user);
    const userId = providerUser.getId();

    return {
      session: {
        [this.#versionKey(userId)]: Date.now(),
        ...providerUser.getOriginal(),
      },
    };
  }
}
