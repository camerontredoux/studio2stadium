import type { symbols } from "@adonisjs/auth";

export type CookieGuardUser<SessionUser> = {
  getId(): string;
  getOriginal(): SessionUser;
};

export interface CookieUserProviderContract<SessionUser> {
  [symbols.PROVIDER_REAL_USER]: SessionUser;

  createUserForGuard(user: SessionUser): Promise<CookieGuardUser<SessionUser>>;
  findByCookie(
    cookie: string,
    cookieCacheName: string
  ): Promise<CookieGuardUser<SessionUser> | null>;
}

export type CookieGuardOptions = {
  /**
   * Time to live in seconds for the cached cookie
   */
  ttl: number;
};
