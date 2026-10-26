import { DatabaseService } from "#database/service";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { E_NOT_FOUND } from "#exceptions/not-found";
import { Exception } from "@adonisjs/core/exceptions";
import { inject } from "@adonisjs/core";
import { and, eq, isNull, sql } from "drizzle-orm";
import { verifyCheckInCode } from "../check-in-code.ts";

export const E_CHECK_IN_CODE_INVALID = class extends Exception {
  static status = 422;
  static code = "E_CHECK_IN_CODE_INVALID";
  static message = "This is not a check-in pass.";
};

export const E_CHECK_IN_CODE_WRONG_EVENT = class extends Exception {
  static status = 409;
  static code = "E_CHECK_IN_CODE_WRONG_EVENT";
  static message = "This pass is for a different event.";
};

export const E_CHECK_IN_ROSTER_NOT_FOUND = class extends Exception {
  static status = 404;
  static code = "E_CHECK_IN_ROSTER_NOT_FOUND";
  static message = "This dancer is no longer on the roster.";
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ScanInput {
  orgId: string;
  eventId: string;
  code: string;
  actorId: string;
}

interface CheckInInput {
  eventId: string;
  rosterId: string;
  actorId: string;
}

/**
 * Checks a Dancer in from the code on their check-in pass. Set-only: a second
 * scan reports the first check-in instead of undoing it, so holding a phone up
 * too long can't check anyone out.
 */
@inject()
export class ScanCheckInService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute({ orgId, eventId, code, actorId }: ScanInput) {
    if (!UUID_RE.test(eventId)) throw new E_NOT_FOUND("Event not found.");

    const [event] = await this.db.use((db) =>
      db
        .select({ id: orgEvents.id })
        .from(orgEvents)
        .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)))
        .limit(1)
    );
    if (!event) throw new E_NOT_FOUND("Event not found.");

    const pass = verifyCheckInCode(code);
    if (!pass) throw new E_CHECK_IN_CODE_INVALID();
    if (pass.eventId !== eventId) throw new E_CHECK_IN_CODE_WRONG_EVENT();

    return this.checkIn({ eventId, rosterId: pass.rosterId, actorId });
  }

  /**
   * Sets a Dancer's check-in time unless it is set already. The caller has
   * checked that the event belongs to the org and that the actor may check
   * this Roster Entry in: a scanned pass, or a Dancer's own self check-in.
   */
  async checkIn({ eventId, rosterId, actorId }: CheckInInput) {
    return this.db.withAudit({ eventId, actorId }, async (tx, audit) => {
      const columns = {
        id: eventRosters.id,
        bib: eventRosters.bibNumber,
        firstName: eventRosters.firstName,
        lastName: eventRosters.lastName,
        checkedInAt: eventRosters.checkedInAt,
      };
      const [roster] = await tx
        .select(columns)
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.id, rosterId),
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "dancer")
          )
        );
      if (!roster) throw new E_CHECK_IN_ROSTER_NOT_FOUND();

      // The isNull guard makes two simultaneous scans race safely: only one
      // update matches, and the other reports the winner's time.
      const [updated] = roster.checkedInAt
        ? []
        : await tx
            .update(eventRosters)
            .set({ checkedInAt: sql`NOW()` })
            .where(
              and(
                eq(eventRosters.id, roster.id),
                isNull(eventRosters.checkedInAt)
              )
            )
            .returning(columns);

      if (updated) {
        audit.log({
          action: "update",
          resource: "roster",
          resourceId: roster.id,
          metadata: {
            field: "checkedInAt",
            before: null,
            after: updated.checkedInAt,
          },
        });
      }

      let current = updated ?? roster;
      if (!current.checkedInAt) {
        // Lost a race with another scan: report the winner's time.
        const [winner] = await tx
          .select(columns)
          .from(eventRosters)
          .where(eq(eventRosters.id, roster.id));
        current = winner ?? current;
      }

      return {
        result: updated
          ? ("checked_in" as const)
          : ("already_checked_in" as const),
        roster: {
          id: current.id,
          bib: current.bib,
          firstName: current.firstName,
          lastName: current.lastName,
          checkedInAt: current.checkedInAt?.toISOString() ?? null,
        },
      };
    });
  }
}
