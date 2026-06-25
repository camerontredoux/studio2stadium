import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { and, eq } from "drizzle-orm";
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
          // Bump limited → standard (leave null accounts untouched)
          await tx
            .update(users)
            .set({ orgAccountTier: "standard" })
            .where(
              and(eq(users.id, userId), eq(users.orgAccountTier, "limited"))
            );
        } else {
          // Downgrade standard → limited (leave null accounts untouched)
          await tx
            .update(users)
            .set({ orgAccountTier: "limited" })
            .where(
              and(eq(users.id, userId), eq(users.orgAccountTier, "standard"))
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
