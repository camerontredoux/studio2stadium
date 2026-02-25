import { achievements } from "#database/schema/dancers";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, { params }: Validator) {
    await this.db.use((db) =>
      db
        .delete(achievements)
        .where(
          and(
            eq(achievements.id, params.id),
            eq(achievements.profileId, profileId)
          )
        )
    );
  }
}
