import BaseQuery from "#utils/base-query";

export class AuthQueries extends BaseQuery {
  /**
   * Find user by email for login verification
   */
  async findUserByEmail(email: string) {
    return await this.use((db) =>
      db
        .selectFrom("users")
        .select(["id", "password"])
        .where("email", "=", email)
        .executeTakeFirst()
    );
  }

  /**
   * Find user by ID with roles for caching after login
   */
  async findUserWithRoles(id: string) {
    return this.use((db) =>
      db
        .selectFrom("users")
        .leftJoin("user_roles", "user_roles.user_id", "users.id")
        .leftJoin("roles", "user_roles.role_id", "roles.id")
        .select(({ fn }) => [
          "users.id",
          "users.email as email",
          "users.display_email as displayEmail",
          "users.username as username",
          "users.avatar as avatar",
          "users.created_at as createdAt",
          fn.agg<string[]>("array_agg", ["roles.type"]).as("roles"),
        ])
        .where("users.id", "=", id)
        .groupBy("users.id")
        .executeTakeFirst()
    );
  }
}
