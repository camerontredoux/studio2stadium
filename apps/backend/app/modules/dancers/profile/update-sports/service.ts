import { dancerSports } from "#database/schema/sports";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    await this.db.tx(async (tx) => {
      await tx.delete(dancerSports).where(eq(dancerSports.dancerId, profileId));

      if (data.sports.length > 0) {
        await tx.insert(dancerSports).values(
          data.sports.map((sport) => ({
            dancerId: profileId,
            sportId: sport,
          }))
        );
      }
    });
  }
}
