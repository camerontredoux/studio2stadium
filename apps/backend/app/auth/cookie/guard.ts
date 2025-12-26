// https://docs.adonisjs.com/guides/authentication/custom-auth-guard

import { errors, type symbols } from "@adonisjs/auth";
import type { AuthClientResponse, GuardContract } from "@adonisjs/auth/types";
import type { HttpContext } from "@adonisjs/core/http";
import type { CookieUserProviderContract } from "./types.ts";

export class CookieGuard<
  UserProvider extends CookieUserProviderContract<unknown>,
> implements GuardContract<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
  /**
   * A list of events and their types emitted by
   * the guard.
   */
  declare [symbols.GUARD_KNOWN_EVENTS]: {};

  /**
   * A unique name for the guard driver
   */
  #name: string;

  /**
   * Reference to the HTTP context
   */
  #ctx: HttpContext;

  /**
   * Reference to the user provider to lookup the user
   */
  #userProvider: UserProvider;

  /**
   * A unique name for the guard driver
   */

  driverName: "cookie" = "cookie";

  /**
   * A boolean to know if the authentication attempt has been made
   */
  authenticationAttempted: boolean = false;

  /**
   * A boolean to know if the current request has
   * been authenticated
   */
  isAuthenticated: boolean = false;

  /**
   * Reference to the currently authenticated user
   *
   * The value only exists after calling one of the
   * following methods.
   *
   * - authenticate
   * - check
   *
   * You can use the "getUserOrFail" method to throw an exception if
   * the request is not authenticated.
   */
  user?: UserProvider[typeof symbols.PROVIDER_REAL_USER];

  /**
   * The name of the cookie used to store the authentication data
   */
  get cookieCacheName() {
    return `auth_${this.#name}`;
  }

  constructor(name: string, ctx: HttpContext, userProvider: UserProvider) {
    this.#name = name;
    this.#ctx = ctx;
    this.#userProvider = userProvider;
  }

  #authenticationFailed() {
    this.isAuthenticated = false;
    this.user = undefined;

    return new errors.E_UNAUTHORIZED_ACCESS("Unauthorized access", {
      guardDriverName: this.driverName,
    });
  }

  #authenticationSucceeded(user: UserProvider[typeof symbols.PROVIDER_REAL_USER]) {
    this.isAuthenticated = true;
    this.user = user;
  }

  async #authenticateViaCookie(cookie: string) {
    const providerUser = await this.#userProvider.findByCookie(cookie, this.cookieCacheName);
    if (!providerUser) {
      throw this.#authenticationFailed();
    }

    this.#ctx.logger.debug("[CACHE]: Hit Cookie cache");
    this.#authenticationSucceeded(providerUser.getOriginal());
    return this.user!;
  }

  /**
   * Authenticate the current HTTP request and return
   * the user instance if there is a valid cached cookie
   * or throw an exception
   */
  async authenticate(): Promise<UserProvider[typeof symbols.PROVIDER_REAL_USER]> {
    if (this.authenticationAttempted) {
      return this.getUserOrFail();
    }

    this.authenticationAttempted = true;
    const session = this.#ctx.request;

    /**
     * Check if there is a cached cookie session in the request.
     * If yes, fetch the user from the cookie session and mark
     * them as logged-in
     */
    const cookie = session.cookie(this.cookieCacheName) as string | null;
    if (cookie) {
      return this.#authenticateViaCookie(cookie);
    }

    throw this.#authenticationFailed();
  }

  /**
   * Same as authenticate, but does not throw an exception, which is
   * useful for checking multiple guards in a single request.
   */
  async check(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the authenticated user or throws an error
   */
  getUserOrFail(): UserProvider[typeof symbols.PROVIDER_REAL_USER] {
    if (!this.user) {
      throw new errors.E_UNAUTHORIZED_ACCESS("Unauthorized access", {
        guardDriverName: this.driverName,
      });
    }

    return this.user;
  }

  /**
   * This method is called by Japa during testing when "loginAs"
   * method is used to login the user.
   */
  async authenticateAsClient(
    user: UserProvider[typeof symbols.PROVIDER_REAL_USER]
  ): Promise<AuthClientResponse> {
    const providerUser = await this.#userProvider.createUserForGuard(user);
    const userId = providerUser.getId();

    return {
      session: {
        [this.#name]: userId,
      },
    };
  }
}
