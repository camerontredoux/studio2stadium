import type { SessionUser } from "#auth/redis/provider";
import { symbols } from "@adonisjs/auth";
import { MessageBuilder } from "@poppinss/utils";
import type { CookieGuardUser, CookieUserProviderContract } from "./types.ts";

export class CookieUserProvider implements CookieUserProviderContract<SessionUser> {
  declare [symbols.PROVIDER_REAL_USER]: SessionUser;

  async createUserForGuard(user: SessionUser): Promise<CookieGuardUser<SessionUser>> {
    return {
      getId() {
        return user.id;
      },
      getOriginal() {
        return user;
      },
    };
  }

  async findByCookie(
    cookie: string,
    cookieCacheName: string
  ): Promise<CookieGuardUser<SessionUser> | null> {
    const messageBuilder = new MessageBuilder();

    const user = messageBuilder.verify<SessionUser>(cookie, cookieCacheName);
    if (!user) {
      return null;
    }

    return this.createUserForGuard(user);
  }
}
