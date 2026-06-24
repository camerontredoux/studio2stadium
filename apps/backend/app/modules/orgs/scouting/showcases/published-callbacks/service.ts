import { DatabaseService } from "#database/service";
import { publishedCallbacks } from "#database/schema/event-features";
import { eventRosters } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, asc, count, eq } from "drizzle-orm";

@inject()
export class PublishedCallbacksService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(showcaseId: string) {
    return this.db.use((db) =>
      db
        .select({
          dancerRosterId: publishedCallbacks.dancerRosterId,
          bibNumber: eventRosters.bibNumber,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          coachCount: count(publishedCallbacks.id).as("coachCount"),
        })
        .from(publishedCallbacks)
        .innerJoin(
          eventRosters,
          eq(eventRosters.id, publishedCallbacks.dancerRosterId)
        )
        .where(
          and(
            eq(publishedCallbacks.showcaseId, showcaseId),
            eq(eventRosters.isStaff, false)
          )
        )
        .groupBy(
          publishedCallbacks.dancerRosterId,
          eventRosters.bibNumber,
          eventRosters.firstName,
          eventRosters.lastName
        )
        .orderBy(asc(eventRosters.bibNumber))
    );
  }
}
