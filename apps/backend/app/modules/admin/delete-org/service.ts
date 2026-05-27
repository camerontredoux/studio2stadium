import { organizations } from "#database/schema/organizations";
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
        .delete(organizations)
        .where(eq(organizations.id, params.id))
        .returning({ id: organizations.id })
    );

    return !!deleted;
  }
}
