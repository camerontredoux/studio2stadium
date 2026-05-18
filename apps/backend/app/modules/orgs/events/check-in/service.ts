import { DatabaseService } from "#database/service";
import { orgEvents, eventRosters } from "#database/schema/org-events";
import { hasEventStarted } from "#utils/event-time";
import { inject } from "@adonisjs/core";
import { and, eq, isNull, sql } from "drizzle-orm";

export class CheckInNotOpenError extends Error {
  constructor() {
    super("Check-in is not open for this event.");
  }
}

export class NotOnRosterError extends Error {
  constructor() {
    super("You are not a dancer on this event's roster.");
  }
}

@inject()
export class CheckInService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, userId: string) {
    return this.db.use(async (db) => {
      const [event] = await db
        .select({
          startDate: orgEvents.startDate,
          startTime: orgEvents.startTime,
          timezone: orgEvents.timezone,
        })
        .from(orgEvents)
        .where(eq(orgEvents.id, eventId));

      if (
        !event?.startTime ||
        !event.timezone ||
        !hasEventStarted(event.startDate, event.startTime, event.timezone)
      ) {
        throw new CheckInNotOpenError();
      }

      const [roster] = await db
        .select({ id: eventRosters.id, checkedInAt: eventRosters.checkedInAt })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.userId, userId),
            eq(eventRosters.type, "dancer"),
          ),
        );

      if (!roster) throw new NotOnRosterError();

      if (roster.checkedInAt) return roster;

      const [updated] = await db
        .update(eventRosters)
        .set({ checkedInAt: sql`NOW()` })
        .where(
          and(
            eq(eventRosters.id, roster.id),
            isNull(eventRosters.checkedInAt),
          ),
        )
        .returning();

      return updated ?? roster;
    });
  }
}
