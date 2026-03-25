import { invalidateUserSessions } from "#auth/invalidate";
import { DatabaseService } from "#database/service";
import { UpdateAvatarService } from "#modules/users/update-avatar/service";
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
    private updateAvatar: UpdateAvatarService
  ) {}

  async execute(payload: Validator) {
    const { params, key } = payload;
    const resolved = await resolveSchoolUserByUsername(
      this.db,
      params.username
    );
    if (!resolved.ok) {
      return { error: resolved.error };
    }

    const response = await this.updateAvatar.execute(
      resolved.school.userId,
      resolved.school.avatar,
      { key }
    );

    if (response?.error) {
      return { error: response.error };
    }

    await invalidateUserSessions(resolved.school.userId);
    await invalidateSchoolProfileCache(resolved.school.username);

    return { success: true };
  }
}
