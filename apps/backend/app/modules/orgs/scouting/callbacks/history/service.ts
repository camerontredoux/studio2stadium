import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import {
  eventCallbacks,
  eventRatings,
  eventShowcases,
  publishedCallbacks,
} from "#database/schema/event-features";
import { eventRosters, eventDancerProfiles } from "#database/schema/org-events";
import { dancerProfiles } from "#database/schema/dancers";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

const dancerColumns = {
  rosterId: eventRosters.id,
  bibNumber: eventRosters.bibNumber,
  firstName: eventRosters.firstName,
  lastName: eventRosters.lastName,
  profilePhotoUrl: eventDancerProfiles.profilePhotoUrl,
  studio: sql<
    string | null
  >`COALESCE(${eventDancerProfiles.studio}, ${dancerProfiles.studio})`,
  // The coach's own rating; ratings belong to the event, not the showcase.
  rating: eventRatings.rating,
};

/**
 * A coach's callbacks for every showcase of an event, newest showcase first.
 * The active showcase lists the dancers the coach has called back so far; a
 * published one lists what was sent for the coach (the top N kept at publish),
 * in rank order. A showcase the coach sent nothing in has no rows.
 */
@inject()
export class CallbackHistoryService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, coachRosterId: string) {
    const showcases = await this.db.use((db) =>
      db
        .select({
          id: eventShowcases.id,
          number: eventShowcases.number,
          status: eventShowcases.status,
          publishedAt: eventShowcases.publishedAt,
        })
        .from(eventShowcases)
        .where(eq(eventShowcases.eventId, eventId))
        .orderBy(desc(eventShowcases.number))
    );

    const idsWith = (status: string) =>
      showcases.filter((s) => s.status === status).map((s) => s.id);
    const activeIds = idsWith("active");
    const publishedIds = idsWith("published");

    const ratingJoin = and(
      eq(eventRatings.dancerRosterId, eventRosters.id),
      eq(eventRatings.coachRosterId, coachRosterId),
      eq(eventRatings.eventId, eventRosters.eventId)
    );

    const [current, sent] = await Promise.all([
      activeIds.length === 0
        ? []
        : this.db.use((db) =>
            db
              .select({
                showcaseId: eventCallbacks.showcaseId,
                ...dancerColumns,
              })
              .from(eventCallbacks)
              .innerJoin(
                eventRosters,
                eq(eventRosters.id, eventCallbacks.dancerRosterId)
              )
              .leftJoin(
                eventDancerProfiles,
                eq(eventDancerProfiles.rosterId, eventRosters.id)
              )
              .leftJoin(
                dancerProfiles,
                eq(dancerProfiles.userId, eventRosters.userId)
              )
              .leftJoin(eventRatings, ratingJoin)
              .where(
                and(
                  inArray(eventCallbacks.showcaseId, activeIds),
                  eq(eventCallbacks.coachRosterId, coachRosterId)
                )
              )
              .orderBy(asc(eventCallbacks.createdAt))
          ),
      publishedIds.length === 0
        ? []
        : this.db.use((db) =>
            db
              .select({
                showcaseId: publishedCallbacks.showcaseId,
                ...dancerColumns,
              })
              .from(publishedCallbacks)
              .innerJoin(
                eventRosters,
                eq(eventRosters.id, publishedCallbacks.dancerRosterId)
              )
              .leftJoin(
                eventDancerProfiles,
                eq(eventDancerProfiles.rosterId, eventRosters.id)
              )
              .leftJoin(
                dancerProfiles,
                eq(dancerProfiles.userId, eventRosters.userId)
              )
              .leftJoin(eventRatings, ratingJoin)
              .where(
                and(
                  inArray(publishedCallbacks.showcaseId, publishedIds),
                  eq(publishedCallbacks.coachRosterId, coachRosterId)
                )
              )
              .orderBy(asc(publishedCallbacks.rank))
          ),
    ]);

    const rows = [...current, ...sent];
    return {
      showcases: showcases.map((showcase) => ({
        ...showcase,
        isCurrent: showcase.status === "active",
        callbacks: rows
          .filter((row) => row.showcaseId === showcase.id)
          .map(({ showcaseId: _showcaseId, ...dancer }) => dancer),
      })),
    };
  }
}
