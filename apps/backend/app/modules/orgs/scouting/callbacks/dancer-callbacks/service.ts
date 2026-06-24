import { DatabaseService } from "#database/service";
import {
  eventShowcases,
  publishedCallbacks,
} from "#database/schema/event-features";
import { eventRosters } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, desc, eq } from "drizzle-orm";

@inject()
export class DancerCallbacksService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, dancerRosterId: string) {
    const [latestPublished] = await this.db.use((db) =>
      db
        .select()
        .from(eventShowcases)
        .where(
          and(
            eq(eventShowcases.eventId, eventId),
            eq(eventShowcases.status, "published")
          )
        )
        .orderBy(desc(eventShowcases.number))
        .limit(1)
    );

    if (!latestPublished) {
      return [];
    }

    return this.db.use((db) =>
      db
        .select({
          coachRosterId: publishedCallbacks.coachRosterId,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          organization: eventRosters.organization,
        })
        .from(publishedCallbacks)
        .innerJoin(
          eventRosters,
          eq(eventRosters.id, publishedCallbacks.coachRosterId)
        )
        .where(
          and(
            eq(publishedCallbacks.showcaseId, latestPublished.id),
            eq(publishedCallbacks.dancerRosterId, dancerRosterId),
            // Defensive: hide any staff (preview) coach from a dancer's callbacks.
            eq(eventRosters.isStaff, false)
          )
        )
        .orderBy(publishedCallbacks.rank)
    );
  }
}
