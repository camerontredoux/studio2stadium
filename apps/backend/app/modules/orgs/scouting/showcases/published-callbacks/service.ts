import { DatabaseService } from "#database/service";
import {
  eventShowcases,
  publishedCallbacks,
} from "#database/schema/event-features";
import { eventRosters } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, asc, count, countDistinct, eq, sql } from "drizzle-orm";
import type { BoardPage } from "../../callbacks/board-page-validator.ts";

@inject()
export class PublishedCallbacksService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  /** One page of a published showcase's dancers; the showcase must be the event's. */
  async execute(eventId: string, showcaseId: string, q: BoardPage = {}) {
    const page = q.page ?? 0;
    const limit = q.limit ?? 100;
    const where = and(
      eq(publishedCallbacks.showcaseId, showcaseId),
      eq(eventRosters.isStaff, false),
      sql`EXISTS (
        SELECT 1 FROM ${eventShowcases}
        WHERE ${eventShowcases.id} = ${showcaseId}
          AND ${eventShowcases.eventId} = ${eventId}
      )`
    );
    const [data, [counted]] = await Promise.all([
      this.db.use((db) =>
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
          .where(where)
          .groupBy(
            publishedCallbacks.dancerRosterId,
            eventRosters.bibNumber,
            eventRosters.firstName,
            eventRosters.lastName
          )
          .orderBy(
            asc(eventRosters.bibNumber),
            asc(publishedCallbacks.dancerRosterId)
          )
          .limit(limit)
          .offset(page * limit)
      ),
      this.db.use((db) =>
        db
          .select({ total: countDistinct(publishedCallbacks.dancerRosterId) })
          .from(publishedCallbacks)
          .innerJoin(
            eventRosters,
            eq(eventRosters.id, publishedCallbacks.dancerRosterId)
          )
          .where(where)
      ),
    ]);
    return { data, total: Number(counted?.total ?? 0) };
  }
}
