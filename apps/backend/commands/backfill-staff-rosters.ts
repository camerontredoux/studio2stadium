import { BaseCommand } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import { sql } from "drizzle-orm";
import { db } from "#database/connection";
import { eventRosters } from "#database/schema/org-events";

/**
 * One-shot data migration: flag pre-existing admin-attended roster rows as
 * staff sandboxes (`is_staff = true`) so they drop out of participant tables,
 * exports, counts, and aggregates — and so the rows admins created via the old
 * "attend" hack become proper preview rosters rather than orphaned pollution.
 *
 * A row is flagged when its attached user is a platform admin
 * (`users.role` in `admin` | `prodigy_admin`) or an org admin
 * (`org_memberships.role = 'admin'`) of the roster's event's org. Admins are
 * never legitimate participants, so every such row is by definition a sandbox.
 *
 * Idempotent: only flips rows currently `is_staff = false`.
 */
export async function backfillStaffRosters(): Promise<number> {
  const updated = await db
    .update(eventRosters)
    .set({ isStaff: true })
    .where(
      sql`
        ${eventRosters.userId} IS NOT NULL
        AND ${eventRosters.isStaff} = false
        AND (
          EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = ${eventRosters.userId}
              AND u.role IN ('admin', 'prodigy_admin')
          )
          OR EXISTS (
            SELECT 1 FROM org_memberships m
            WHERE m.user_id = ${eventRosters.userId}
              AND m.role = 'admin'
              AND m.org_id = (
                SELECT org_id FROM org_events WHERE id = ${eventRosters.eventId}
              )
          )
        )
      `
    )
    .returning({ id: eventRosters.id });

  return updated.length;
}

export default class BackfillStaffRosters extends BaseCommand {
  static commandName = "backfill:staff-rosters";
  static description =
    "Flag existing admin-attended event_rosters rows as staff sandboxes";

  static options: CommandOptions = {
    startApp: true,
  };

  async run() {
    const count = await backfillStaffRosters();
    this.logger.success(`Flagged ${count} admin roster row(s) as staff.`);
  }
}
