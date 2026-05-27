import { orgMemberships } from "#database/schema/organizations";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator) {
    const [deleted] = await this.db.use((db) =>
      db
        .delete(orgMemberships)
        .where(eq(orgMemberships.id, params.memberId))
        .returning({ id: orgMemberships.id })
    );

    return !!deleted;
  }
}
