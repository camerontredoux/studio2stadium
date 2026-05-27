import { organizations } from "#database/schema/organizations";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(input: Validator) {
    const [org] = await this.db.use((db) =>
      db
        .insert(organizations)
        .values({
          name: input.name,
          slug: input.slug,
          logoUrl: input.logoUrl,
          primaryColor: input.primaryColor,
          accentColor: input.accentColor,
          features: input.features ?? {},
          settings: input.settings ?? {},
        })
        .returning()
    );

    return org;
  }
}
