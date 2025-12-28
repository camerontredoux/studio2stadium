import { db } from "#database/connection";
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
 * Find user by ID with roles for caching after login
 */
export async function findUserWithRoles(id: string) {
  return await db
    .selectFrom("users")
    .leftJoin("user_roles", "user_roles.user_id", "users.id")
    .leftJoin("roles", "user_roles.role_id", "roles.id")
    .select([
      "users.id",
      "users.email as email",
      "users.display_email as displayEmail",
      "users.username as username",
      "users.avatar as avatar",
      "users.created_at as createdAt",
      sql<string[]>`array_remove(array_agg(${sql.ref("roles.type")}), NULL)`.as("roles"),
    ])
    .where("users.id", "=", id)
    .groupBy("users.id")
    .executeTakeFirst();
}
