import { dancerProfiles } from "#database/schema/dancers";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    await this.db.use((db) =>
      db
        .update(dancerProfiles)
        .set(data)
        .where(eq(dancerProfiles.id, profileId))
    );
  }
}
