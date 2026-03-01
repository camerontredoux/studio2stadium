import { schoolSports } from "#database/schema/sports";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    await this.db.tx(async (tx) => {
      await tx.delete(schoolSports).where(eq(schoolSports.schoolId, profileId));

      if (data.sports.length > 0) {
        await tx.insert(schoolSports).values(
          data.sports.map((sport) => ({
            schoolId: profileId,
            sportId: sport,
          }))
        );
      }
    });
  }
}
