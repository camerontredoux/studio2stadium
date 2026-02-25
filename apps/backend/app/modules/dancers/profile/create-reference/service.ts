import { references } from "#database/schema/dancers";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    await this.db.use((db) =>
      db.insert(references).values({
        profileId,
        name: data.name,
        title: data.title,
        description: data.description,
      })
    );
  }
}
