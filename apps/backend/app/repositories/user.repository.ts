import { type User } from "#database/generated/types";
import { type Insertable, type Updateable } from "kysely";
import BaseQuery from "../shared/base-query.ts";

export class UserRepository extends BaseQuery {
  /**
   * Find user by ID
   */
  async findById(id: string) {
    return await this.use((db) =>
      db.selectFrom("users").selectAll().where("id", "=", id).executeTakeFirst()
    );
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return await this.use((db) =>
      db.selectFrom("users").selectAll().where("email", "=", email).executeTakeFirst()
    );
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string) {
    return await this.use((db) =>
      db.selectFrom("users").selectAll().where("username", "=", username).executeTakeFirst()
    );
  }

  /**
   * Create a new user
   */
  async create(data: Insertable<User>) {
    return await this.use((db) =>
      db
        .insertInto("users")
        .values(data)
        .returning([
          "id",
          "email",
          "display_email",
          "username",
          "first_name",
          "last_name",
          "image",
          "phone",
          "created_at",
          "updated_at",
          "last_logged_in",
        ])
        .executeTakeFirstOrThrow()
    );
  }

  /**
   * Update user
   */
  async update(id: string, data: Updateable<User>) {
    return await this.use((db) =>
      db.updateTable("users").set(data).where("id", "=", id).returningAll().executeTakeFirst()
    );
  }

  /**
   * Delete user
   */
  async delete(id: string) {
    return await this.use((db) =>
      db.deleteFrom("users").where("id", "=", id).returningAll().executeTakeFirst()
    );
  }

  /**
   * Find user with their dancer account
   */
  async findWithDancerAccount(id: string) {
    return await this.use((db) =>
      db
        .selectFrom("users")
        .leftJoin("dancer_accounts", "dancer_accounts.user_id", "users.id")
        .selectAll("users")
        .select([
          "dancer_accounts.id as dancer_account_id",
          "dancer_accounts.birthday",
          "dancer_accounts.biography",
          "dancer_accounts.skill_level",
        ])
        .where("users.id", "=", id)
        .executeTakeFirst()
    );
  }

  /**
   * Find user with their school account
   */
  async findWithSchoolAccount(id: string) {
    return await this.use((db) =>
      db
        .selectFrom("users")
        .leftJoin("school_accounts", "school_accounts.user_id", "users.id")
        .selectAll("users")
        .select([
          "school_accounts.id as school_account_id",
          "school_accounts.name",
          "school_accounts.location",
          "school_accounts.division",
          // Add other school_account fields as needed
        ])
        .where("users.id", "=", id)
        .executeTakeFirst()
    );
  }

  /**
   * Find user with active subscription
   */
  async findWithActiveSubscription(id: string) {
    return await this.use((db) =>
      db
        .selectFrom("users")
        .innerJoin("subscriptions", "subscriptions.user_id", "users.id")
        .selectAll("users")
        .select([
          "subscriptions.id as subscription_id",
          "subscriptions.subscription_id as stripe_subscription_id",
          "subscriptions.current_period_end",
          "subscriptions.canceled_at",
          "subscriptions.cancel_at_period_end",
        ])
        .where("users.id", "=", id)
        .where((eb) =>
          eb.or([
            eb("subscriptions.current_period_end", ">", new Date()),
            eb("subscriptions.current_period_end", "is", null),
          ])
        )
        .executeTakeFirst()
    );
  }

  /**
   * Find user with all their roles
   */
  async findWithRoles(id: string) {
    const user = await this.findById(id);
    if (!user) return null;

    const roles = await this.use((db) =>
      db
        .selectFrom("user_roles")
        .innerJoin("roles", "roles.id", "user_roles.role_id")
        .select(["roles.id", "roles.type"])
        .where("user_roles.user_id", "=", id)
        .execute()
    );

    return {
      ...user,
      roles,
    };
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const result = await this.use((db) =>
      db.selectFrom("users").select("id").where("email", "=", email).executeTakeFirst()
    );

    return !!result;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const result = await this.use((db) =>
      db.selectFrom("users").select("id").where("username", "=", username).executeTakeFirst()
    );

    return !!result;
  }

  /**
   * List all users with pagination
   */
  async list(params: { limit?: number; offset?: number } = {}) {
    const { limit = null, offset = 0 } = params;

    const users = await this.use((db) =>
      db.selectFrom("users").selectAll().limit(limit).offset(offset).execute()
    );

    const total = await this.use((db) =>
      db
        .selectFrom("users")
        .select((eb) => eb.fn.countAll().as("count"))
        .executeTakeFirst()
    );

    return {
      users,
      total: Number(total?.count ?? 0),
      limit,
      offset,
    };
  }
}
