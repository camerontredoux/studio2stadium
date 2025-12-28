import type { symbols } from "@adonisjs/auth";

/**
 * Guard user is an adapter between the user provider and the guard.
 * The guard is user provider agnostic and therefore it needs an adapter
 * to know some basic info about the user.
 */
export type RedisGuardUser<RealUser> = {
  getId(): string;
  getOriginal(): RealUser;
};

/**
 * The user provider used by the Redis session guard to lookup users
 * during authentication. This is a simplified version without
 * remember-me token support.
 */
export interface RedisUserProviderContract<RealUser> {
  [symbols.PROVIDER_REAL_USER]: RealUser;

  /**
   * Create a user object that acts as an adapter between
   * the guard and real user value.
   */
  createUserForGuard(user: RealUser): Promise<RedisGuardUser<RealUser>>;

  /**
   * Find a user by their id from the database.
   */
  findById(identifier: string): Promise<RedisGuardUser<RealUser> | null>;
}

export type RedisGuardOptions = {
  /**
   * Time to live in seconds for the cached cookie
   */
  cookieCacheTtl: number;
  /**
   * Name of the cookie cache
   */
  cookieCacheName: string;
  /**
   * Session age in seconds - used for Redis version key TTL
   */
  sessionAge: number;
};
