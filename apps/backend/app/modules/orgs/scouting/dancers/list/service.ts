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
import type { ScoutingViewScope } from "../../view-scope.ts";

@inject()
export class ListDancersService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    orgId: string,
    activeEventId: string | null,
    view: ScoutingViewScope | null,
    q: Validator,
    filterCheckedInOnly: boolean = false,
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

      // The coach's own marks live on the event being viewed, not on whichever
      // event the org happens to have active. Browsing back to a past event
      // re-scopes both halves of the (eventId, coachRosterId) key; a coach who
      // never attended that event has no roster row there and sees nothing.
      const viewEventId = view?.eventId ?? null;
      const viewCoachRosterId = view?.coachRosterId ?? null;
      const viewShowcaseId = view?.showcaseId ?? null;

      const interestedSubquery = viewCoachRosterId
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM event_school_selections ess
            WHERE ess.dancer_roster_id = ${eventRosters.id}
              AND ess.coach_roster_id = ${viewCoachRosterId}
              AND ess.event_id = ${viewEventId}
          )`
        : sql<boolean>`false`;

      const isFavoritedSubquery = viewCoachRosterId
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${eventFavorites}
            WHERE ${eventFavorites.dancerRosterId} = ${eventRosters.id}
              AND ${eventFavorites.coachRosterId} = ${viewCoachRosterId}
              AND ${eventFavorites.eventId} = ${viewEventId}
          )`
        : sql<boolean>`false`;

      const ratingSubquery = viewCoachRosterId
        ? sql<number | null>`(
            SELECT ${eventRatings.rating} FROM ${eventRatings}
            WHERE ${eventRatings.dancerRosterId} = ${eventRosters.id}
              AND ${eventRatings.coachRosterId} = ${viewCoachRosterId}
              AND ${eventRatings.eventId} = ${viewEventId}
            LIMIT 1
          )`
        : sql<number | null>`NULL`;

      const hasNoteSubquery = viewCoachRosterId
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${eventNotes}
            WHERE ${eventNotes.dancerRosterId} = ${eventRosters.id}
              AND ${eventNotes.coachRosterId} = ${viewCoachRosterId}
              AND ${eventNotes.eventId} = ${viewEventId}
          )`
        : sql<boolean>`false`;

      // A finished event has no active showcase, so fall back to the event as a
      // whole there — otherwise this column would read false for every past
      // event while the detail sheet, which matches on eventId, said true.
      const isCalledBackSubquery = !viewCoachRosterId
        ? sql<boolean>`false`
        : viewShowcaseId
          ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${eventCallbacks}
            WHERE ${eventCallbacks.dancerRosterId} = ${eventRosters.id}
              AND ${eventCallbacks.coachRosterId} = ${viewCoachRosterId}
              AND ${eventCallbacks.showcaseId} = ${viewShowcaseId}
          )`
          : sql<boolean>`EXISTS (
            SELECT 1 FROM ${eventCallbacks}
            WHERE ${eventCallbacks.dancerRosterId} = ${eventRosters.id}
              AND ${eventCallbacks.coachRosterId} = ${viewCoachRosterId}
              AND ${eventCallbacks.eventId} = ${viewEventId}
          )`;

      if (filterCheckedInOnly) {
        filters.push(isNotNull(eventRosters.checkedInAt));
        filters.push(isNotNull(eventRosters.userId));
      }

      if (q.interested && viewCoachRosterId) {
        filters.push(
          sql`EXISTS (
            SELECT 1 FROM event_school_selections ess
            WHERE ess.dancer_roster_id = ${eventRosters.id}
              AND ess.coach_roster_id = ${viewCoachRosterId}
              AND ess.event_id = ${viewEventId}
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
          state: sql<
            string | null
          >`COALESCE(${eventDancerProfiles.state}, ${dancerProfiles.location})`,
          interestedInMySchool: interestedSubquery,
          isFavorited: isFavoritedSubquery,
          rating: ratingSubquery,
          hasNote: hasNoteSubquery,
          isCalledBack: isCalledBackSubquery,
          username: users.username,
          userId: eventRosters.userId,
          email: eventRosters.email,
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
    // event. Collapse to one row per dancer — keyed by their account, falling
    // back to email for rows no one has claimed — preferring the active event's
    // row so the coach's favorites/ratings/callbacks stay wired to it.
    const deduped = selectedEventId
      ? rows
      : this.dedupeByDancer(rows, activeEventId);

    return deduped.map((row) => ({
      rosterId: row.rosterId,
      // A bib only identifies a dancer at the event that issued it. When the
      // coach browses the org's history, a dancer who is not on the active
      // event's roster is shown without one rather than under a stale number.
      bibNumber:
        selectedEventId || row.eventId === activeEventId ? row.bibNumber : null,
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
      email: string | null;
      eventId: string;
      createdAt: Date | null;
    },
  >(rows: T[], activeEventId: string | null): T[] {
    // An older event's row for the same person is often still unclaimed, so it
    // carries no account to match on. Email is the only identity those rows
    // share with the claimed row, and rosters are unique by email per event.
    const accountByEmail = new Map<string, string>();
    for (const row of rows) {
      const email = this.normalizeEmail(row.email);
      if (!email || !row.userId || accountByEmail.has(email)) continue;
      accountByEmail.set(email, row.userId);
    }

    const byDancer = new Map<string, T>();
    for (const row of rows) {
      const key = this.dancerKey(row, accountByEmail);
      const current = byDancer.get(key);
      if (!current || this.isBetterRow(row, current, activeEventId)) {
        byDancer.set(key, row);
      }
    }
    return [...byDancer.values()].sort(
      (a, b) => (a.bibNumber ?? Infinity) - (b.bibNumber ?? Infinity)
    );
  }

  private dancerKey(
    row: { rosterId: string; userId: string | null; email: string | null },
    accountByEmail: Map<string, string>
  ) {
    if (row.userId) return `user:${row.userId}`;
    const email = this.normalizeEmail(row.email);
    if (!email) return `roster:${row.rosterId}`;
    const account = accountByEmail.get(email);
    return account ? `user:${account}` : `email:${email}`;
  }

  private normalizeEmail(email: string | null) {
    return email?.trim().toLowerCase() || null;
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
