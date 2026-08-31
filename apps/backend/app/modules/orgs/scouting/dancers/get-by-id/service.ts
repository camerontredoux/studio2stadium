import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import {
  eventRosters,
  eventDancerProfiles,
  orgEvents,
} from "#database/schema/org-events";
import { dancerProfiles } from "#database/schema/dancers";
import {
  eventCallbacks,
  eventFavorites,
  eventNotes,
  eventRatings,
} from "#database/schema/event-features";
import { users } from "#database/schema/users";
import { and, eq, sql } from "drizzle-orm";
import type { ScoutingViewScope } from "../../view-scope.ts";

@inject()
export class GetDancerByIdService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    orgId: string,
    dancerRosterId: string,
    view: ScoutingViewScope | null,
    requireEventMatch: boolean = false,
    isActiveEvent: boolean = true
  ) {
    const viewEventId = view?.eventId ?? null;
    const coachRosterId = view?.coachRosterId ?? null;
    const rows = await this.db.use((db) =>
      db
        .select({
          rosterId: eventRosters.id,
          bibNumber: eventRosters.bibNumber,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          isRegistered: sql<boolean>`${eventRosters.userId} IS NOT NULL`,
          username: users.username,
          profilePhotoUrl: eventDancerProfiles.profilePhotoUrl,
          gradYear: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gradYear}, ${dancerProfiles.gradYear})`,
          gpa: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gpa}, ${dancerProfiles.gpa})`,
          studio: sql<
            string | null
          >`COALESCE(${eventDancerProfiles.studio}, ${dancerProfiles.studio})`,
          state: eventDancerProfiles.state,
          height: eventDancerProfiles.height,
          danceStyles: eventDancerProfiles.danceStyles,
          bio: eventDancerProfiles.bio,
          extra: eventDancerProfiles.extra,
          highSchool: dancerProfiles.highSchool,
          location: dancerProfiles.location,
          eventId: eventRosters.eventId,
        })
        .from(eventRosters)
        .leftJoin(
          eventDancerProfiles,
          eq(eventDancerProfiles.rosterId, eventRosters.id)
        )
        .leftJoin(
          dancerProfiles,
          eq(dancerProfiles.userId, eventRosters.userId)
        )
        .leftJoin(users, eq(users.id, eventRosters.userId))
        .innerJoin(orgEvents, eq(orgEvents.id, eventRosters.eventId))
        .where(
          and(
            eq(eventRosters.id, dancerRosterId),
            eq(orgEvents.orgId, orgId),
            eq(eventRosters.type, "dancer")
          )
        )
        .limit(1)
    );

    if (rows.length === 0) return null;

    const dancer = rows[0];

    // Pairing an explicitly requested event with a roster row from a different
    // one would silently return empty marks, which reads as "nothing scouted"
    // rather than the mismatch it is. Only applies to an explicit selection —
    // under "All events" the scope is the active event while the collapsed row
    // may legitimately come from an older one.
    if (requireEventMatch && dancer!.eventId !== viewEventId) return null;

    let note: string | null = null;
    let rating: number | null = null;
    let isFavorited = false;
    let isCalledBack = false;

    if (coachRosterId !== null && viewEventId !== null) {
      const [noteRow, ratingRow, favoriteRow, callbackRow] = await Promise.all([
        this.db.use((db) =>
          db
            .select({ content: eventNotes.content })
            .from(eventNotes)
            .where(
              and(
                eq(eventNotes.eventId, viewEventId!),
                eq(eventNotes.coachRosterId, coachRosterId),
                eq(eventNotes.dancerRosterId, dancerRosterId)
              )
            )
            .limit(1)
        ),
        this.db.use((db) =>
          db
            .select({ rating: eventRatings.rating })
            .from(eventRatings)
            .where(
              and(
                eq(eventRatings.eventId, viewEventId!),
                eq(eventRatings.coachRosterId, coachRosterId),
                eq(eventRatings.dancerRosterId, dancerRosterId)
              )
            )
            .limit(1)
        ),
        this.db.use((db) =>
          db
            .select({ id: eventFavorites.id })
            .from(eventFavorites)
            .where(
              and(
                eq(eventFavorites.eventId, viewEventId!),
                eq(eventFavorites.coachRosterId, coachRosterId),
                eq(eventFavorites.dancerRosterId, dancerRosterId)
              )
            )
            .limit(1)
        ),
        this.db.use((db) =>
          db
            .select({ id: eventCallbacks.id })
            .from(eventCallbacks)
            .where(
              and(
                eq(eventCallbacks.eventId, viewEventId!),
                eq(eventCallbacks.coachRosterId, coachRosterId),
                eq(eventCallbacks.dancerRosterId, dancerRosterId)
              )
            )
            .limit(1)
        ),
      ]);

      note = noteRow[0]?.content ?? null;
      rating = ratingRow[0]?.rating ?? null;
      isFavorited = favoriteRow.length > 0;
      // Callbacks belong to the event in progress and are not retained across
      // events, unlike favorites, notes and ratings.
      isCalledBack = isActiveEvent && callbackRow.length > 0;
    }

    return {
      ...dancer,
      note,
      rating,
      isFavorited,
      isCalledBack,
      favoritedMyRosterId: null,
      // Lets the sheet distinguish "nothing scouted here" from "you were never
      // at this event", so an empty panel does not read as lost data.
      isViewerRostered: coachRosterId !== null,
    };
  }
}
