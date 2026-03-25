import { invalidateUserSessions } from "#auth/invalidate";
import { DatabaseService } from "#database/service";
import { Service as UpdateStylesService } from "#modules/schools/update-styles/service";
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
    private updateStyles: UpdateStylesService
  ) {}

  async execute(payload: Validator) {
    const { params, ...stylesPayload } = payload;
    const resolved = await resolveSchoolUserByUsername(this.db, params.username);
    if (!resolved.ok) {
      return { error: resolved.error };
    }

    await this.updateStyles.execute(resolved.school.profileId, stylesPayload);
    await invalidateUserSessions(resolved.school.userId);
    await invalidateSchoolProfileCache(resolved.school.username);

    return { success: true };
  }
}
