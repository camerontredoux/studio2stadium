import { dancerSkills } from "#database/schema/skills";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    await this.db.tx(async (tx) => {
      await tx.delete(dancerSkills).where(eq(dancerSkills.dancerId, profileId));

      if (data.skills.length > 0) {
        await tx.insert(dancerSkills).values(
          data.skills.map((skill) => ({
            dancerId: profileId,
            skillId: skill,
          }))
        );
      }
    });
  }
}
