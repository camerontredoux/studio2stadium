import { BaseCommand } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { eq } from "drizzle-orm";
import { db } from "#database/connection";
import { platforms, users } from "#database/schema/users";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { rosterTypeMembershipConflict } from "#shared/org/membership";

/**
 * One-shot data migration: map every `user_platforms` row into an equivalent
 * `org_memberships` row on the corresponding `organizations` entry.
 *
 * Role mapping:
 *   - user.role === "prodigy_admin" AND platform === "prodigy" → admin
 *   - everything else → member
 *
 * Type mapping:
 *   - user.type === "school" → coach
 *   - user.type === "dancer" → dancer
 *
 * Idempotent via the (user_id, org_id) unique index on org_memberships.
 */
export async function backfillOrgMemberships(): Promise<number> {
  const orgs = await db.select().from(organizations);
  const slugToId = new Map(orgs.map((o) => [o.slug, o.id]));

  const rows = await db
    .select({
      userId: platforms.userId,
      platformName: platforms.platformName,
      role: users.role,
      type: users.type,
    })
    .from(platforms)
    .innerJoin(users, eq(users.id, platforms.userId));

  let inserted = 0;
  for (const row of rows) {
    const orgId = slugToId.get(row.platformName);
    if (!orgId) continue;

    const memberType = row.type === "school" ? "coach" : "dancer";
    const membershipRole =
      row.platformName === "prodigy" && row.role === "prodigy_admin"
        ? "admin"
        : "member";

    await db
      .insert(orgMemberships)
      .values({
        userId: row.userId,
        orgId,
        type: memberType,
        role: membershipRole,
      })
      .onConflictDoNothing(rosterTypeMembershipConflict());
    inserted += 1;
  }

  return inserted;
}

export default class BackfillOrgMemberships extends BaseCommand {
  static commandName = "backfill:org-memberships";
  static description = "Migrate user_platforms rows to org_memberships";

  static options: CommandOptions = {
    startApp: true,
  };

  async run() {
    const count = await backfillOrgMemberships();
    this.logger.success(`Processed ${count} platform rows.`);
  }
}
