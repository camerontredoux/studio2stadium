import { dancerProfiles } from "#database/schema/dancers";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { DancerCreatedEvent } from "./event.ts";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async createDancer(userId: string, data: Validator) {
    await this.db.tx(async (tx) => {
      await tx
        .update(users)
        .set({
          ...(data.phoneNumber && { phone: data.phoneNumber }),
          verified: true,
        })
        .where(eq(users.id, userId));

      await tx.insert(dancerProfiles).values({
        userId,
        birthday: data.birthday.toISOString(),
        location: data.location,
      });
    });

    DancerCreatedEvent.dispatch({ userId });
  }
}
