import { danceEvents } from "#database/schema/events";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, asc, eq, gt } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class ListTrackerEventsService {
  constructor(private db: DatabaseService) {}

  /**
   * Upcoming school-hosted events, soonest first, optionally only one
   * school's. Same rule as the Events page: a verified school's events.
   */
  async execute({ schoolId }: Validator) {
    return await this.db.use((db) =>
      db
        .select({
          id: danceEvents.id,
          title: danceEvents.title,
          type: danceEvents.type,
          startDatetime: danceEvents.startDatetime,
          school: { id: schoolProfiles.id, name: schoolProfiles.name },
        })
        .from(danceEvents)
        .innerJoin(schoolProfiles, eq(schoolProfiles.id, danceEvents.schoolId))
        .innerJoin(users, eq(users.id, schoolProfiles.userId))
        .where(
          and(
            gt(danceEvents.startDatetime, new Date()),
            eq(users.verified, true),
            schoolId ? eq(danceEvents.schoolId, schoolId) : undefined
          )
        )
        .orderBy(asc(danceEvents.startDatetime), asc(danceEvents.id))
    );
  }
}
