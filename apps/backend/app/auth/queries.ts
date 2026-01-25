import { db } from "#database/connection";
import { type PlatformName } from "#database/generated/types";
import { sql } from "kysely";

/**
 * Find user by email for login verification
 */
export async function findUserByEmail(email: string) {
  return await db
    .selectFrom("users")
    .select(["id", "password"])
    .where("email", "=", email)
    .executeTakeFirst();
}

/**
 * Get user session by ID for caching after login
 */
export async function getUserSession(id: string) {
  return await db
    .selectFrom("users")
    .leftJoin("dancer_accounts", "dancer_accounts.user_id", "users.id")
    .leftJoin(
      "dancer_platforms",
      "dancer_platforms.account_id",
      "dancer_accounts.id"
    )
    .leftJoin("user_subscriptions", "user_subscriptions.user_id", "users.id")
    .select(({ fn, eb, selectFrom }) => [
      "users.id as id",
      "users.email as email",
      "users.display_email as displayEmail",
      "users.username as username",
      "users.avatar as avatar",
      "users.account_type as type",
      "users.role as role",
      eb
        .exists(
          selectFrom("user_subscriptions")
            .select(sql`1`.as("one"))
            .whereRef("user_subscriptions.user_id", "=", "users.id")
            .where("user_subscriptions.current_period_end", ">", new Date())
        )
        .$castTo<boolean>()
        .as("subscribed"),
      fn
        .agg<PlatformName[]>("json_agg", ["dancer_platforms.platform_name"])
        .filterWhere("dancer_platforms.platform_name", "is not", null)
        .as("platforms"),
    ])
    .where("users.id", "=", id)
    .groupBy("users.id")
    .executeTakeFirst();
}
