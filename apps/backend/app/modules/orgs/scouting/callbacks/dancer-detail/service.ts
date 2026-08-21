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
   */
  async execute(orgId: string, dancerRosterId: string) {
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
          showcaseId: eventShowcases.id,
          showcaseNumber: eventShowcases.number,
          showcaseStatus: eventShowcases.status,
          createdAt: eventCallbacks.createdAt,
          isPublished: sql<boolean>`EXISTS (
            SELECT 1 FROM published_callbacks pc
            WHERE pc.showcase_id = ${eventCallbacks.showcaseId}
              AND pc.coach_roster_id = ${eventCallbacks.coachRosterId}
              AND pc.dancer_roster_id = ${eventCallbacks.dancerRosterId}
          )`,
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
        .orderBy(
          desc(eventShowcases.number),
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
