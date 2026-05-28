import { DatabaseService } from "#database/service";
import { organizations } from "#database/schema/organizations";
import { inject } from "@adonisjs/core";
import { eq, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class UpdateOrgSettingsService {
  constructor(private db: DatabaseService) {}

  async execute(orgId: string, patch: Validator) {
    return this.db.use(async (db) => {
      let settingsExpr;

      if (patch.defaultTimezone === null || patch.defaultTimezone === undefined) {
        settingsExpr = sql`${organizations.settings} - 'defaultTimezone'`;
      } else {
        settingsExpr = sql`${organizations.settings} || ${JSON.stringify({ defaultTimezone: patch.defaultTimezone })}::jsonb`;
      }

      const [org] = await db
        .update(organizations)
        .set({ settings: settingsExpr })
        .where(eq(organizations.id, orgId))
        .returning();

      return org ?? null;
    });
  }
}
