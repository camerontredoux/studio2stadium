import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { normalizeEmail } from "#utils/normalize-email";
import { inject } from "@adonisjs/core";
import { ValidationError } from "@vinejs/vine";
import { eq, sql } from "drizzle-orm";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string, data: Validator) {
    let email: string | undefined;
    if (data.displayEmail) {
      email = await normalizeEmail(data.displayEmail);
    }

    if (data.username) {
      const [result] = await this.db.use((db) =>
        db.execute<{ exists: boolean }>(
          sql`SELECT EXISTS (SELECT 1 FROM users WHERE username = ${data.username} AND id != ${userId})`
        )
      );

      if (result.exists) {
        throw new ValidationError([
          {
            field: "username",
            message: "Username is already taken",
            rule: "unique",
          },
        ]);
      }
    }

    await this.db.use((db) =>
      db
        .update(users)
        .set({
          ...data,
          email,
        })
        .where(eq(users.id, userId))
    );
  }
}
