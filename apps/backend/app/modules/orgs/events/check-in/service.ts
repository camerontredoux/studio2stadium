import { DatabaseService } from "#database/service";
import { orgEvents, eventRosters } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { isCheckInOpen, orgDefaultTimezone } from "#utils/event-time";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { ScanCheckInService } from "./scan/service.ts";

export class CheckInNotOpenError extends Error {
  constructor() {
    super("Check-in is not open for this event.");
  }
}

export class SelfCheckInOffError extends Error {
  constructor() {
    super("Show your pass at the check-in desk to check in.");
  }
}

export class NotOnRosterError extends Error {
  constructor() {
    super("You are not a dancer on this event's roster.");
  }
}

/**
 * A Dancer checking themselves in from their dashboard, allowed only on an
 * event with self check-in turned on. It writes through the same path as a
 * scanned pass, so the desk sees it exactly as it sees a scan.
 */
@inject()
export class CheckInService {
  constructor(
    private db: DatabaseService = new DatabaseService(),
    private scan: ScanCheckInService = new ScanCheckInService()
  ) {}

  async execute(orgId: string, eventId: string, userId: string) {
    const roster = await this.db.use(async (db) => {
      const [event] = await db
        .select({
          startDate: orgEvents.startDate,
          endDate: orgEvents.endDate,
          startTime: orgEvents.startTime,
          endTime: orgEvents.endTime,
          timezone: orgEvents.timezone,
          selfCheckIn: orgEvents.selfCheckIn,
          orgSettings: organizations.settings,
          orgFeatures: organizations.features,
        })
        .from(orgEvents)
        .innerJoin(organizations, eq(organizations.id, orgEvents.orgId))
        .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)));

      const features = (event?.orgFeatures ?? {}) as Record<string, boolean>;
      if (!event || !features.check_in || !event.selfCheckIn) {
        throw new SelfCheckInOffError();
      }
      if (!isCheckInOpen(event, orgDefaultTimezone(event.orgSettings))) {
        throw new CheckInNotOpenError();
      }

      const [entry] = await db
        .select({ id: eventRosters.id })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.userId, userId),
            eq(eventRosters.type, "dancer")
          )
        );
      if (!entry) throw new NotOnRosterError();
      return entry;
    });

    return this.scan.checkIn({ eventId, rosterId: roster.id, actorId: userId });
  }
}
