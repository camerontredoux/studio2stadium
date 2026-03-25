import { invalidateUserSessions } from "#auth/invalidate";
import { DatabaseService } from "#database/service";
import { Service as UpdateSkillsService } from "#modules/schools/update-skills/service";
import { inject } from "@adonisjs/core";
import {
  invalidateSchoolProfileCache,
  resolveSchoolUserByUsername,
} from "../resolve-school-user.ts";
import { type Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(
    private db: DatabaseService,
    private updateSkills: UpdateSkillsService
  ) {}

  async execute(payload: Validator) {
    const { params, ...skillsPayload } = payload;
    const resolved = await resolveSchoolUserByUsername(
      this.db,
      params.username
    );
    if (!resolved.ok) {
      return { error: resolved.error };
    }

    await this.updateSkills.execute(resolved.school.profileId, skillsPayload);
    await invalidateUserSessions(resolved.school.userId);
    await invalidateSchoolProfileCache(resolved.school.username);

    return { success: true };
  }
}
