import { invalidateUserSessions } from "#auth/invalidate";
import { DatabaseService } from "#database/service";
import { Service as UpdateAccountService } from "#modules/users/update-account/service";
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
    private updateAccount: UpdateAccountService
  ) {}

  async execute(payload: Validator) {
    const { params, ...accountData } = payload;
    const resolved = await resolveSchoolUserByUsername(
      this.db,
      params.username
    );
    if (!resolved.ok) {
      return { error: resolved.error };
    }

    await this.updateAccount.execute(resolved.school.userId, accountData);
    await invalidateUserSessions(resolved.school.userId);
    await invalidateSchoolProfileCache(resolved.school.username);

    return { success: true };
  }
}
