import { DatabaseService } from "#database/service";
import {
  eventCallbacks,
  eventShowcases,
} from "#database/schema/event-features";
import { eventRosters, orgEvents } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";
import { and, asc, desc, eq, sql } from "drizzle-orm";

@inject()
export class DancerCallbackDetailService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  /**
   * Every school that called this dancer back, across every showcase of the
   * event — including callbacks that have not been published yet, so admins
   * can tell a dancer who to connect with before results go out.
   *
   * One row per school, not per callback. A school that called the same dancer
   * back in several showcases is a single school to connect with, so its
   * showcases are collapsed into one row and counted, rather than repeating the
   * school down the list.
   */
  async execute(orgId: string, dancerRosterId: string) {
    const isPublished = sql<boolean>`EXISTS (
      SELECT 1 FROM published_callbacks pc
      WHERE pc.showcase_id = ${eventCallbacks.showcaseId}
        AND pc.coach_roster_id = ${eventCallbacks.coachRosterId}
        AND pc.dancer_roster_id = ${eventCallbacks.dancerRosterId}
    )`;

    const rows = await this.db.use((db) =>
      db
        .select({
          coachRosterId: eventCallbacks.coachRosterId,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          organization: eventRosters.organization,
          // Null when the school has never claimed its account: no profile to
          // link to and no picture to show.
          username: users.username,
          avatar: users.avatar,
          showcaseNumbers: sql<
            number[]
          >`ARRAY_AGG(DISTINCT ${eventShowcases.number} ORDER BY ${eventShowcases.number} DESC)`,
          latestShowcaseNumber: sql<number>`MAX(${eventShowcases.number})::int`,
          callbackCount: sql<number>`COUNT(*)::int`,
          releasedCount: sql<number>`COUNT(*) FILTER (WHERE ${isPublished})::int`,
        })
        .from(eventCallbacks)
        .innerJoin(
          eventShowcases,
          eq(eventShowcases.id, eventCallbacks.showcaseId)
        )
        .innerJoin(orgEvents, eq(orgEvents.id, eventShowcases.eventId))
        .innerJoin(
          eventRosters,
          eq(eventRosters.id, eventCallbacks.coachRosterId)
        )
        .leftJoin(users, eq(users.id, eventRosters.userId))
        .where(
          and(
            eq(eventCallbacks.dancerRosterId, dancerRosterId),
            eq(orgEvents.orgId, orgId),
            eq(eventRosters.isStaff, false)
          )
        )
        .groupBy(
          eventCallbacks.coachRosterId,
          eventRosters.firstName,
          eventRosters.lastName,
          eventRosters.organization,
          users.username,
          users.avatar
        )
        // Most recently interested school first, so the admin sees who is
        // currently in play before who called back rounds ago.
        .orderBy(
          desc(sql`MAX(${eventShowcases.number})`),
          asc(eventRosters.organization),
          asc(eventRosters.lastName)
        )
    );

    return rows.map(({ avatar, ...row }) => ({
      ...row,
      avatarUrl: imageUrl(avatar, "avatar"),
    }));
  }
}
