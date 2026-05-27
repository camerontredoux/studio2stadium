import { orgMemberships } from "#database/schema/organizations";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, email, role, type }: Validator) {
    const user = await this.db.use((db) =>
      db.query.users.findFirst({
        where: { email },
        columns: { id: true, email: true, firstName: true, lastName: true },
      })
    );

    if (!user) {
      return { error: "No user found with that email address" };
    }

    const [membership] = await this.db.use((db) =>
      db
        .insert(orgMemberships)
        .values({
          orgId: params.id,
          userId: user.id,
          role,
          type,
        })
        .returning()
    );

    return membership;
  }
}
