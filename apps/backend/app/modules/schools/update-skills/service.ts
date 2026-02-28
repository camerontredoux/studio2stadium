import { schoolSkills } from "#database/schema/skills";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    await this.db.tx(async (tx) => {
      await tx.delete(schoolSkills).where(eq(schoolSkills.schoolId, profileId));

      if (data.skills.length > 0) {
        await tx.insert(schoolSkills).values(
          data.skills.map((skill) => ({
            schoolId: profileId,
            skillId: skill,
          }))
        );
      }
    });
  }
}
