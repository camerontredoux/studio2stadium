import { findUserWithRoles } from "#auth/queries";
import { symbols } from "@adonisjs/auth";
import type { RedisGuardUser, RedisUserProviderContract } from "./types.ts";

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof findUserWithRoles>>
>;

/**
 * Stateless user provider that only handles database lookups.
 * Session caching and version validation are handled by the guard.
 */
export class RedisUserProvider implements RedisUserProviderContract<SessionUser> {
  declare [symbols.PROVIDER_REAL_USER]: SessionUser;

  async createUserForGuard(
    user: SessionUser
  ): Promise<RedisGuardUser<SessionUser>> {
    return {
      getId() {
        return user.id;
      },
      getOriginal() {
        return user;
      },
    };
  }

  async findById(
    identifier: string
  ): Promise<RedisGuardUser<SessionUser> | null> {
    const user = await findUserWithRoles(identifier);

    if (!user) {
      return null;
    }

    return this.createUserForGuard(user);
  }
}
