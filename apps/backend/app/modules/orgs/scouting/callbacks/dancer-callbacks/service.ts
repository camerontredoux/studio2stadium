import { DatabaseService } from "#database/service";
import {
  eventShowcases,
  publishedCallbacks,
} from "#database/schema/event-features";
import { eventRosters } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq, sql } from "drizzle-orm";

@inject()
export class DancerCallbacksService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, dancerRosterId: string) {
    const [published] = await this.db.use((db) =>
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(eventShowcases)
        .where(
          and(
            eq(eventShowcases.eventId, eventId),
            eq(eventShowcases.status, "published")
          )
        )
    );

    const publishedShowcaseCount = Number(published?.count ?? 0);

    if (publishedShowcaseCount === 0) {
      return { publishedShowcaseCount: 0, callbacks: [] };
    }

    // Callbacks accumulate across every published showcase for the event — a
    // school that called this dancer back in showcase 1 stays visible after
    // showcase 2 is published. One row per school, tagged with the showcases
    // they called her back in.
    const callbacks = await this.db.use((db) =>
      db
        .select({
          coachRosterId: publishedCallbacks.coachRosterId,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          organization: eventRosters.organization,
          firstShowcaseNumber: sql<number>`MIN(${eventShowcases.number})::int`,
          showcaseNumbers: sql<
            number[]
          >`ARRAY_AGG(DISTINCT ${eventShowcases.number} ORDER BY ${eventShowcases.number})`,
        })
        .from(publishedCallbacks)
        .innerJoin(
          eventShowcases,
          eq(eventShowcases.id, publishedCallbacks.showcaseId)
        )
        .innerJoin(
          eventRosters,
          eq(eventRosters.id, publishedCallbacks.coachRosterId)
        )
        .where(
          and(
            eq(eventShowcases.eventId, eventId),
            eq(eventShowcases.status, "published"),
            eq(publishedCallbacks.dancerRosterId, dancerRosterId),
            // Defensive: hide any staff (preview) coach from a dancer's callbacks.
            eq(eventRosters.isStaff, false)
          )
        )
        .groupBy(
          publishedCallbacks.coachRosterId,
          eventRosters.firstName,
          eventRosters.lastName,
          eventRosters.organization
        )
        .orderBy(
          sql`MIN(${eventShowcases.number})`,
          sql`${eventRosters.organization} NULLS LAST`
        )
    );

    return { publishedShowcaseCount, callbacks };
  }
}
