import { BaseCommand } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "#database/connection";
import { favorites } from "#database/schema/profiles";
import { organizations } from "#database/schema/organizations";

/**
 * Populate school_favorites.source_org_id for existing rows by matching the
 * legacy platform_name enum ("core" | "prodigy") against organizations.slug.
 *
 * Safe to run repeatedly — only touches rows where source_org_id IS NULL.
 */
export async function backfillSchoolFavoritesOrg(): Promise<number> {
  const orgs = await db.select().from(organizations);
  let updated = 0;
  for (const org of orgs) {
    if (org.slug !== "core" && org.slug !== "prodigy") continue;
    const rows = await db
      .update(favorites)
      .set({ sourceOrgId: org.id })
      .where(
        and(
          eq(favorites.platformName, org.slug as "core" | "prodigy"),
          isNull(favorites.sourceOrgId)
        )
      )
      .returning({ id: favorites.id });
    updated += rows.length;
  }
  return updated;
}

export default class BackfillSchoolFavoritesOrg extends BaseCommand {
  static commandName = "backfill:school-favorites-org";
  static description =
    "Fill school_favorites.source_org_id from the legacy platform_name column";

  static options: CommandOptions = {
    startApp: true,
  };

  async run() {
    const count = await backfillSchoolFavoritesOrg();
    this.logger.success(`Updated ${count} school_favorites rows.`);
  }
}
