import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters } from "#database/schema/org-events";
import { and, eq } from "drizzle-orm";

@inject()
export class ListSchoolsService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string) {
    return this.db.use((db) =>
      db
        .select({
          rosterId: eventRosters.id,
          organization: eventRosters.organization,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
        })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "coach")
          )
        )
        .orderBy(eventRosters.organization)
    );
  }
}
