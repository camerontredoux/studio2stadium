import { DatabaseService } from "#database/service";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { signCheckInCode } from "../../check-in/check-in-code.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CheckInCodeInput {
  orgId: string;
  eventId: string;
  rosterId: string;
}

/**
 * The pass code for one Dancer's Roster Entry, so an organizer can show it at
 * the desk. Coaches have no pass, so a coach entry is not found, like an entry
 * from another event or another org.
 */
@inject()
export class RosterCheckInCodeService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute({ orgId, eventId, rosterId }: CheckInCodeInput) {
    if (!UUID_RE.test(eventId) || !UUID_RE.test(rosterId)) {
      throw new E_NOT_FOUND("Roster entry not found.");
    }

    const [roster] = await this.db.use((db) =>
      db
        .select({ id: eventRosters.id })
        .from(eventRosters)
        .innerJoin(orgEvents, eq(orgEvents.id, eventRosters.eventId))
        .where(
          and(
            eq(eventRosters.id, rosterId),
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "dancer"),
            eq(orgEvents.orgId, orgId)
          )
        )
        .limit(1)
    );
    if (!roster) throw new E_NOT_FOUND("Roster entry not found.");

    return { checkInCode: signCheckInCode(roster.id, eventId) };
  }
}
