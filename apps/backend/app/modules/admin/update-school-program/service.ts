import { invalidateUserSessions } from "#auth/invalidate";
import { DatabaseService } from "#database/service";
import { UpdateProgramService } from "#modules/schools/update-program/service";
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
    private updateProgram: UpdateProgramService
  ) {}

  async execute(payload: Validator) {
    const { params, ...programData } = payload;
    const resolved = await resolveSchoolUserByUsername(
      this.db,
      params.username
    );
    if (!resolved.ok) {
      return { error: resolved.error };
    }

    await this.updateProgram.execute(resolved.school.profileId, programData);
    await invalidateUserSessions(resolved.school.userId);
    await invalidateSchoolProfileCache(resolved.school.username);

    return { success: true };
  }
}
