import { schoolProfiles } from "#database/schema/schools";
import { platforms, users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { normalizeEmail } from "#utils/normalize-email";
import { inject } from "@adonisjs/core";
import hash from "@adonisjs/core/services/hash";
import { SignupEvent } from "./event.ts";
import type { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(input: Validator) {
    const user = await this.createUser(input);

    SignupEvent.dispatch(user);

    return user;
  }

  async createUser(input: Validator) {
    const [email, password] = await Promise.all([
      normalizeEmail(input.email),
      hash.make(input.password),
    ]);

    return await this.db.tx(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: email,
          displayEmail: input.email,
          password: password,
          firstName: input.firstName,
          lastName: input.lastName,
          type: input.type,
          username: input.username,
          phone: input.phone,
          role: "user",
        })
        .returning({
          id: users.id,
          displayEmail: users.displayEmail,
          firstName: users.firstName,
          lastName: users.lastName,
          type: users.type,
        });

      await tx.insert(platforms).values({
        platformName: "core",
        userId: user.id,
      });

      if (input.type === "school") {
        if (!input.name || !input.location) {
          throw new Error("Cannot create school without name or location");
        }

        await tx.insert(schoolProfiles).values({
          userId: user.id,
          name: input.name,
          location: input.location,
        });
      }

      return user;
    });
  }
}
