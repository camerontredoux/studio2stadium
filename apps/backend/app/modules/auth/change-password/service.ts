import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { inject } from "@adonisjs/core";
import hash from "@adonisjs/core/services/hash";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(userId: string, data: Validator) {
    const user = await this.db.use((db) =>
      db.query.users.findFirst({
        where: {
          id: userId,
        },
        columns: {
          password: true,
        },
      })
    );

    if (!user) throw new E_BAD_REQUEST("User not found");

    const verified = await hash.verify(user.password, data.currentPassword);
    if (!verified) {
      throw new E_BAD_REQUEST("Invalid current password");
    }

    const password = await hash.make(data.newPassword);

    await this.db.use((db) =>
      db.update(users).set({ password }).where(eq(users.id, userId))
    );
  }
}
