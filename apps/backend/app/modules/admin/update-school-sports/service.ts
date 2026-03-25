import { invalidateUserSessions } from "#auth/invalidate";
import { DatabaseService } from "#database/service";
import { Service as UpdateSportsService } from "#modules/schools/update-sports/service";
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
    private updateSports: UpdateSportsService
  ) {}

  async execute(payload: Validator) {
    const { params, ...sportsPayload } = payload;
    const resolved = await resolveSchoolUserByUsername(
      this.db,
      params.username
    );
    if (!resolved.ok) {
      return { error: resolved.error };
    }

    await this.updateSports.execute(resolved.school.profileId, sportsPayload);
    await invalidateUserSessions(resolved.school.userId);
    await invalidateSchoolProfileCache(resolved.school.username);

    return { success: true };
  }
}
