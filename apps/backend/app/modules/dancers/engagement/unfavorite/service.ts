import { platformName } from "#database/schema/enums";
import { favorites } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(
    { params }: Validator,
    profileId: string,
    platform: (typeof platformName.enumValues)[number]
  ) {
    await this.db.use((db) =>
      db
        .delete(favorites)
        .where(
          and(
            eq(favorites.schoolId, profileId),
            eq(favorites.dancerId, params.id),
            eq(favorites.platformName, platform)
          )
        )
    );
  }
}
