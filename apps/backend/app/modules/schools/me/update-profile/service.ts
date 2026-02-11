import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { normalizeEmail } from "#utils/normalize-email";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string, data: Validator) {
    let email: string | undefined;
    if (data.displayEmail) {
      email = await normalizeEmail(data.displayEmail);
    }

    return this.db.use((db) => {
      return db
        .update(users)
        .set({ ...data, email })
        .where(eq(users.id, userId));
    });
  }
}
