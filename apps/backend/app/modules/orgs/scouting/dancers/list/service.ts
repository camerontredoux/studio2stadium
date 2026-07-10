import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import {
  eventRosters,
  eventDancerProfiles,
  orgEvents,
} from "#database/schema/org-events";
import {
  eventFavorites,
  eventRatings,
  eventNotes,
  eventCallbacks,
} from "#database/schema/event-features";
import { dancerProfiles } from "#database/schema/dancers";
import { users } from "#database/schema/users";
import { and, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class ListDancersService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    orgId: string,
    activeEventId: string | null,
    coachRosterId: string | null,
    q: Validator,
    filterCheckedInOnly: boolean = false,
    showcaseId?: string,
    selectedEventId?: string
  ) {
    const rows = await this.db.use((db) => {
      const filters = [
        selectedEventId
          ? eq(eventRosters.eventId, selectedEventId)
          : sql`${eventRosters.eventId} IN (
              SELECT ${orgEvents.id} FROM ${orgEvents}
              WHERE ${orgEvents.orgId} = ${orgId}
            )`,
        eq(eventRosters.type, "dancer"),
        eq(eventRosters.isStaff, false),
      ];

      if (q.bib !== undefined) {
        filters.push(eq(eventRosters.bibNumber, q.bib));
      } else if (q.search) {
        const pattern = `%${q.search}%`;
        filters.push(
          or(
            ilike(eventRosters.firstName, pattern),
            ilike(eventRosters.lastName, pattern)
          )!
        );
      }

      const interestedSubquery = coachRosterId
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM event_school_selections ess
            WHERE ess.dancer_roster_id = ${eventRosters.id}
              AND ess.coach_roster_id = ${coachRosterId}
              AND ess.event_id = ${activeEventId}
          )`
        : sql<boolean>`false`;

      const isFavoritedSubquery = coachRosterId
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${eventFavorites}
            WHERE ${eventFavorites.dancerRosterId} = ${eventRosters.id}
              AND ${eventFavorites.coachRosterId} = ${coachRosterId}
              AND ${eventFavorites.eventId} = ${activeEventId}
          )`
        : sql<boolean>`false`;

      const ratingSubquery = coachRosterId
        ? sql<number | null>`(
            SELECT ${eventRatings.rating} FROM ${eventRatings}
            WHERE ${eventRatings.dancerRosterId} = ${eventRosters.id}
              AND ${eventRatings.coachRosterId} = ${coachRosterId}
              AND ${eventRatings.eventId} = ${activeEventId}
            LIMIT 1
          )`
        : sql<number | null>`NULL`;

      const hasNoteSubquery = coachRosterId
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${eventNotes}
            WHERE ${eventNotes.dancerRosterId} = ${eventRosters.id}
              AND ${eventNotes.coachRosterId} = ${coachRosterId}
              AND ${eventNotes.eventId} = ${activeEventId}
          )`
        : sql<boolean>`false`;

      const isCalledBackSubquery =
        coachRosterId && showcaseId
          ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${eventCallbacks}
            WHERE ${eventCallbacks.dancerRosterId} = ${eventRosters.id}
              AND ${eventCallbacks.coachRosterId} = ${coachRosterId}
              AND ${eventCallbacks.showcaseId} = ${showcaseId}
          )`
          : sql<boolean>`false`;

      if (filterCheckedInOnly) {
        filters.push(isNotNull(eventRosters.checkedInAt));
        filters.push(isNotNull(eventRosters.userId));
      }

      if (q.interested && coachRosterId) {
        filters.push(
          sql`EXISTS (
            SELECT 1 FROM event_school_selections ess
            WHERE ess.dancer_roster_id = ${eventRosters.id}
              AND ess.coach_roster_id = ${coachRosterId}
              AND ess.event_id = ${activeEventId}
          )`
        );
      }

      return db
        .select({
          rosterId: eventRosters.id,
          bibNumber: eventRosters.bibNumber,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          isRegistered: sql<boolean>`${eventRosters.userId} IS NOT NULL`,
          profilePhotoUrl: eventDancerProfiles.profilePhotoUrl,
          gpa: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gpa}, ${dancerProfiles.gpa})`,
          gradYear: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gradYear}, ${dancerProfiles.gradYear})`,
          studio: sql<
            string | null
          >`COALESCE(${eventDancerProfiles.studio}, ${dancerProfiles.studio})`,
          state: eventDancerProfiles.state,
          interestedInMySchool: interestedSubquery,
          isFavorited: isFavoritedSubquery,
          rating: ratingSubquery,
          hasNote: hasNoteSubquery,
          isCalledBack: isCalledBackSubquery,
          username: users.username,
          userId: eventRosters.userId,
          eventId: eventRosters.eventId,
          createdAt: eventRosters.createdAt,
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
        .where(and(...filters))
        .orderBy(eventRosters.bibNumber);
    });

    // Across all of the org's events the same dancer can hold a roster row per
    // event. Collapse to one row per dancer — keyed by their account when
    // registered, otherwise left distinct — preferring the active event's row
    // so the coach's favorites/ratings/callbacks stay wired to it.
    const deduped = selectedEventId
      ? rows
      : this.dedupeByDancer(rows, activeEventId);

    return deduped.map((row) => ({
      rosterId: row.rosterId,
      bibNumber: row.bibNumber,
      firstName: row.firstName,
      lastName: row.lastName,
      isRegistered: row.isRegistered,
      profilePhotoUrl: row.profilePhotoUrl,
      gpa: row.gpa,
      gradYear: row.gradYear,
      studio: row.studio,
      state: row.state,
      interestedInMySchool: row.interestedInMySchool,
      isFavorited: row.isFavorited,
      rating: row.rating,
      hasNote: row.hasNote,
      isCalledBack: row.isCalledBack,
      username: row.username,
      eventId: row.eventId,
    }));
  }

  private dedupeByDancer<
    T extends {
      rosterId: string;
      bibNumber: number | null;
      userId: string | null;
      eventId: string;
      createdAt: Date | null;
    },
  >(rows: T[], activeEventId: string | null): T[] {
    const byDancer = new Map<string, T>();
    for (const row of rows) {
      const key = row.userId ?? `roster:${row.rosterId}`;
      const current = byDancer.get(key);
      if (!current || this.isBetterRow(row, current, activeEventId)) {
        byDancer.set(key, row);
      }
    }
    return [...byDancer.values()].sort(
      (a, b) => (a.bibNumber ?? Infinity) - (b.bibNumber ?? Infinity)
    );
  }

  private isBetterRow(
    candidate: { eventId: string; createdAt: Date | null },
    current: { eventId: string; createdAt: Date | null },
    activeEventId: string | null
  ) {
    const candidateActive = candidate.eventId === activeEventId;
    const currentActive = current.eventId === activeEventId;
    if (candidateActive !== currentActive) return candidateActive;
    return (
      (candidate.createdAt?.getTime() ?? 0) >
      (current.createdAt?.getTime() ?? 0)
    );
  }
}
