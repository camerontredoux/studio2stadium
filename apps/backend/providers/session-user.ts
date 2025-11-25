import { Users } from "#database/generated/types";
import { db } from "#database/connection";
import { symbols } from "@adonisjs/auth";
import { SessionGuardUser, SessionUserProviderContract } from "@adonisjs/auth/types/session";
import { Selectable } from "kysely";
import { Omit } from "#shared/omit";

export type RealUser = Omit<Selectable<Users>, "password">;

export class SessionUserProvider implements SessionUserProviderContract<RealUser> {
  declare [symbols.PROVIDER_REAL_USER]: RealUser;

  async createUserForGuard(user: RealUser): Promise<SessionGuardUser<RealUser>> {
    return {
      getId() {
        return user.id;
      },
      getOriginal() {
        return user;
      },
    };
  }

  async findById(identifier: string): Promise<SessionGuardUser<RealUser> | null> {
    const user = await db
      .selectFrom("users")
      .leftJoin("users_roles", "users_roles.user_id", "users.id")
      .leftJoin("roles", "users_roles.role_id", "roles.id")
      .select(({ fn }) => [
        "users.id",
        "email",
        "display_email",
        "username",
        "first_name",
        "last_name",
        "image",
        "phone",
        "users.created_at",
        "users.updated_at",
        fn.agg<string[]>("array_agg", ["roles.type"]).as("roles"),
      ])
      .where("users.id", "=", identifier)
      .groupBy("users.id")
      .executeTakeFirst();

    if (!user) {
      return null;
    }

    return this.createUserForGuard(user);
  }
}
