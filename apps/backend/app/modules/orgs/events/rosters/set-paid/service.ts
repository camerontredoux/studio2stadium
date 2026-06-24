import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { organizations, premiumGrants } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { AuditContext } from "#database/audit";

export class RosterNotFoundError extends Error {
  code = "ROSTER_NOT_FOUND" as const;
  constructor() {
    super("Roster entry not found.");
    this.name = "RosterNotFoundError";
  }
}

export class NotADancerError extends Error {
  code = "NOT_A_DANCER" as const;
  constructor() {
    super("Paid status applies to dancer roster entries only.");
    this.name = "NotADancerError";
  }
}

/**
 * Admin override of a dancer's paid status from the roster sheet.
 *
 * Beyond flipping the roster flag, this reconciles the linked user's *real*
 * access so the toggle is meaningful for already-registered dancers:
 *   - paid=true  → clear `users.limited` and ensure an active premium grant.
 *   - paid=false → set `users.limited` and revoke their active grants.
 * Pending (unclaimed) rows only get the flag; access is decided when they claim.
 */
@inject()
export class SetRosterPaidService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    rosterId: string,
    paid: boolean,
    audit: AuditContext
  ) {
    return this.db.withAudit(audit, async (tx, auditLog) => {
      const [row] = await tx
        .select()
        .from(eventRosters)
        .where(
          and(eq(eventRosters.id, rosterId), eq(eventRosters.eventId, eventId))
        )
        .for("update");

      if (!row) throw new RosterNotFoundError();
      if (row.type !== "dancer") throw new NotADancerError();

      const wasPaid = row.paid;

      await tx
        .update(eventRosters)
        .set({ paid })
        .where(eq(eventRosters.id, rosterId));

      // Reconcile the linked user's real access (registered dancers only).
      if (row.userId) {
        const userId = row.userId;

        if (paid) {
          await tx
            .update(users)
            .set({ limited: false })
            .where(eq(users.id, userId));

          const [activeGrant] = await tx
            .select({ id: premiumGrants.id })
            .from(premiumGrants)
            .where(
              and(
                eq(premiumGrants.userId, userId),
                gt(premiumGrants.expiresAt, new Date()),
                isNull(premiumGrants.revokedAt)
              )
            )
            .limit(1);

          if (!activeGrant) {
            const [event] = await tx
              .select({ orgId: orgEvents.orgId, endDate: orgEvents.endDate })
              .from(orgEvents)
              .where(eq(orgEvents.id, eventId))
              .limit(1);
            const [org] = event
              ? await tx
                  .select({ settings: organizations.settings })
                  .from(organizations)
                  .where(eq(organizations.id, event.orgId))
                  .limit(1)
              : [undefined];
            const settings =
              (org?.settings as { premium_period_days?: number }) ?? {};
            const periodDays = settings.premium_period_days ?? 90;
            const base = event
              ? new Date((event.endDate as string) + "T00:00:00Z")
              : new Date();
            const expiresAt = new Date(base);
            expiresAt.setDate(expiresAt.getDate() + periodDays);

            await tx.insert(premiumGrants).values({
              userId,
              sourceType: "org_event",
              sourceId: eventId,
              expiresAt,
            });
          }
        } else {
          await tx
            .update(users)
            .set({ limited: true })
            .where(eq(users.id, userId));

          // Revoke every active grant so "unpaid" actually restricts access —
          // grant lookups are global, so a partial revoke would leave them
          // subscribed via another grant.
          await tx
            .update(premiumGrants)
            .set({ revokedAt: new Date() })
            .where(
              and(
                eq(premiumGrants.userId, userId),
                isNull(premiumGrants.revokedAt)
              )
            );
        }
      }

      auditLog.log({
        action: "update",
        resource: "roster",
        resourceId: rosterId,
        metadata: {
          field: "paid",
          before: wasPaid,
          after: paid,
          userId: row.userId,
        },
      });

      return { id: rosterId, paid, isRegistered: row.userId !== null };
    });
  }
}
