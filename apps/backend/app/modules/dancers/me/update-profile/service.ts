import { dancerProfiles } from "#database/schema/dancers";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { normalizeEmail } from "#utils/normalize-email";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string, { birthday, location, ...user }: Validator) {
    let email: string | undefined;
    if (user.displayEmail) {
      email = await normalizeEmail(user.displayEmail);
    }

    await this.db.tx(async (tx) => {
      await tx
        .update(users)
        .set({
          ...user,
          email,
        })
        .where(eq(users.id, userId));

      await tx
        .update(dancerProfiles)
        .set({
          birthday,
          location,
        })
        .where(eq(dancerProfiles.userId, userId));
    });
  }
}
