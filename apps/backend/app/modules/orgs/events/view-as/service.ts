import type { RosterType } from "#database/schema/enums";
import { DatabaseService } from "#database/service";
import { eventRosters } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import type { SessionUser } from "#auth/provider";
import { and, eq } from "drizzle-orm";

/** Admins preview the event as a Coach or a Dancer; there is no organizer view. */
type ViewAsType = RosterType;

/**
 * Provisions an admin's staff "preview" roster for the active event so they can
 * use coach/dancer features (which are keyed on a real `event_rosters.id`)
 * without polluting participant data. The row is flagged `isStaff = true`, so it
 * is excluded from every participant-facing and aggregate query.
 *
 * Idempotent: keyed by (eventId, userId, type) — at most one staff-coach and one
 * staff-dancer per admin per event (enforced by the partial unique index). Never
 * touches participant rows; admins are never real participants.
 */
@inject()
export class ViewAsService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, user: SessionUser, type: ViewAsType) {
    return this.db.tx(async (tx) => {
      const [existing] = await tx
        .select()
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.userId, user.id),
            eq(eventRosters.type, type),
            eq(eventRosters.isStaff, true)
          )
        )
        .limit(1);

      if (existing) {
        const stale =
          existing.email !== user.displayEmail ||
          existing.firstName !== user.firstName ||
          existing.lastName !== user.lastName;
        if (!stale) return existing;

        const [updated] = await tx
          .update(eventRosters)
          .set({
            email: user.displayEmail,
            firstName: user.firstName,
            lastName: user.lastName,
          })
          .where(eq(eventRosters.id, existing.id))
          .returning();
        return updated!;
      }

      const [created] = await tx
        .insert(eventRosters)
        .values({
          eventId,
          userId: user.id,
          type,
          email: user.displayEmail,
          firstName: user.firstName,
          lastName: user.lastName,
          isStaff: true,
        })
        .returning();

      return created!;
    });
  }
}
