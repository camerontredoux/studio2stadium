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
import { and, eq, isNotNull, sql, type SQL } from "drizzle-orm";
import type { Validator } from "./validator.ts";
import type { ScoutingViewScope } from "../../view-scope.ts";

export const DEFAULT_PAGE_SIZE = 50;

type Row = {
  rosterId: string;
  bibNumber: number | null;
  firstName: string;
  lastName: string;
  isRegistered: boolean;
  profilePhotoUrl: string | null;
  gpa: number | null;
  gradYear: number | null;
  studio: string | null;
  state: string | null;
  interestedInMySchool: boolean;
  isFavorited: boolean;
  rating: number | null;
  hasNote: boolean;
  isCalledBack: boolean;
  username: string | null;
  eventId: string;
};

type Counts = {
  all: number;
  favorites: number;
  calledBack: number;
  rated: number;
  total: number;
};

/** Escapes LIKE wildcards so a search for "50%" matches the text, not a pattern. */
function likePattern(search: string) {
  return `%${search.replace(/[\\%_]/g, "\\$&")}%`;
}

@inject()
export class ListDancersService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  /**
   * One page of the coach's dancers, plus the counts the filter tabs and
   * dashboard widgets show. Search, filter, sort and the "All events" dedupe
   * all run in SQL, so a page is the same slice the full list would show.
   */
  async execute(
    orgId: string,
    activeEventId: string | null,
    view: ScoutingViewScope | null,
    q: Validator,
    filterCheckedInOnly: boolean = false,
    selectedEventId?: string
  ) {
    const limit = q.limit ?? DEFAULT_PAGE_SIZE;
    const page = q.page ?? 0;
    const shown = this.shownDancers(
      orgId,
      activeEventId,
      view,
      q,
      filterCheckedInOnly,
      selectedEventId
    );
    const matches = this.matches(q);

    const [rows, [counts]] = await this.db.use((db) =>
      Promise.all([
        db.execute<Row>(sql`
          ${shown}
          SELECT
            roster_id AS "rosterId",
            shown_bib AS "bibNumber",
            first_name AS "firstName",
            last_name AS "lastName",
            is_registered AS "isRegistered",
            profile_photo_url AS "profilePhotoUrl",
            gpa,
            grad_year AS "gradYear",
            studio,
            state,
            interested AS "interestedInMySchool",
            is_favorited AS "isFavorited",
            rating,
            has_note AS "hasNote",
            is_called_back AS "isCalledBack",
            username,
            event_id AS "eventId"
          FROM shown
          WHERE ${matches}
          ORDER BY ${this.orderBy(q)}
          LIMIT ${limit} OFFSET ${page * limit}
        `),
        db.execute<Counts>(sql`
          ${shown}
          SELECT
            count(*)::int AS "all",
            (count(*) FILTER (WHERE is_favorited))::int AS favorites,
            (count(*) FILTER (WHERE is_called_back))::int AS "calledBack",
            (count(*) FILTER (WHERE COALESCE(rating, 0) > 0))::int AS rated,
            (count(*) FILTER (WHERE ${matches}))::int AS total
          FROM shown
        `),
      ])
    );

    const { total, ...tabs } = counts ?? {
      all: 0,
      favorites: 0,
      calledBack: 0,
      rated: 0,
      total: 0,
    };
    return { data: [...rows], total, counts: tabs };
  }

  /**
   * `WITH ... shown`: the coach's dancers with their marks, one row per dancer.
   * Across all of the org's events the same dancer can hold a roster row per
   * event, so "All events" collapses them (see `deduped`).
   */
  private shownDancers(
    orgId: string,
    activeEventId: string | null,
    view: ScoutingViewScope | null,
    q: Validator,
    filterCheckedInOnly: boolean,
    selectedEventId?: string
  ) {
    const filters: SQL[] = [
      selectedEventId
        ? eq(eventRosters.eventId, selectedEventId)
        : sql`${eventRosters.eventId} IN (
            SELECT ${orgEvents.id} FROM ${orgEvents}
            WHERE ${orgEvents.orgId} = ${orgId}
          )`,
      eq(eventRosters.type, "dancer"),
      eq(eventRosters.isStaff, false),
    ];
    if (q.bib !== undefined) filters.push(eq(eventRosters.bibNumber, q.bib));
    if (filterCheckedInOnly) {
      filters.push(isNotNull(eventRosters.checkedInAt));
      filters.push(isNotNull(eventRosters.userId));
    }

    // The coach's own marks live on the event being viewed, not on whichever
    // event the org happens to have active. Browsing back to a past event
    // re-scopes both halves of the (eventId, coachRosterId) key; a coach who
    // never attended that event has no roster row there and sees nothing.
    const viewEventId = view?.eventId ?? null;
    const coachRosterId = view?.coachRosterId ?? null;
    const showcaseId = view?.showcaseId ?? null;

    const interested = coachRosterId
      ? sql`EXISTS (
          SELECT 1 FROM event_school_selections ess
          WHERE ess.dancer_roster_id = ${eventRosters.id}
            AND ess.coach_roster_id = ${coachRosterId}
            AND ess.event_id = ${viewEventId}
        )`
      : sql`false`;
    if (q.interested && coachRosterId) filters.push(interested);

    const isFavorited = coachRosterId
      ? sql`EXISTS (
          SELECT 1 FROM ${eventFavorites}
          WHERE ${eventFavorites.dancerRosterId} = ${eventRosters.id}
            AND ${eventFavorites.coachRosterId} = ${coachRosterId}
            AND ${eventFavorites.eventId} = ${viewEventId}
        )`
      : sql`false`;
    const rating = coachRosterId
      ? sql`(
          SELECT ${eventRatings.rating} FROM ${eventRatings}
          WHERE ${eventRatings.dancerRosterId} = ${eventRosters.id}
            AND ${eventRatings.coachRosterId} = ${coachRosterId}
            AND ${eventRatings.eventId} = ${viewEventId}
          LIMIT 1
        )`
      : sql`NULL::smallint`;
    const hasNote = coachRosterId
      ? sql`EXISTS (
          SELECT 1 FROM ${eventNotes}
          WHERE ${eventNotes.dancerRosterId} = ${eventRosters.id}
            AND ${eventNotes.coachRosterId} = ${coachRosterId}
            AND ${eventNotes.eventId} = ${viewEventId}
        )`
      : sql`false`;
    // Callbacks belong to the showcase running at the time and are not
    // retained across events, so a finished event reports none.
    const isCalledBack =
      coachRosterId && showcaseId
        ? sql`EXISTS (
            SELECT 1 FROM ${eventCallbacks}
            WHERE ${eventCallbacks.dancerRosterId} = ${eventRosters.id}
              AND ${eventCallbacks.coachRosterId} = ${coachRosterId}
              AND ${eventCallbacks.showcaseId} = ${showcaseId}
          )`
        : sql`false`;
    const onActiveEvent = activeEventId
      ? sql`(${eventRosters.eventId} = ${activeEventId})`
      : sql`false`;

    // A bib only identifies a dancer at the event that issued it. When the
    // coach browses the org's history, a dancer who is not on the active
    // event's roster is shown without one rather than under a stale number.
    const shownBib = selectedEventId
      ? sql`bib_number`
      : sql`CASE WHEN on_active_event THEN bib_number END`;

    // Collapse to one row per dancer, keyed by their account, falling back to
    // email for rows no one has claimed. An older event's row is often still
    // unclaimed, so it carries no account to match on: email is the only
    // identity it shares with the claimed row (rosters are unique by email per
    // event). Prefer the active event's row so the coach's marks stay wired to
    // it, then the newest.
    const deduped = selectedEventId
      ? sql`deduped AS (SELECT * FROM scoped)`
      : sql`accounts AS (
          SELECT DISTINCT ON (email_key) email_key, user_id
          FROM scoped
          WHERE user_id IS NOT NULL AND email_key IS NOT NULL
          ORDER BY email_key, bib_number NULLS LAST, roster_id
        ),
        deduped AS (
          SELECT DISTINCT ON (dancer_key) *
          FROM (
            SELECT scoped.*, COALESCE(
              'user:' || scoped.user_id,
              'user:' || accounts.user_id,
              'email:' || scoped.email_key,
              'roster:' || scoped.roster_id
            ) AS dancer_key
            FROM scoped
            LEFT JOIN accounts ON accounts.email_key = scoped.email_key
          ) keyed
          ORDER BY dancer_key, on_active_event DESC, created_at DESC NULLS LAST,
            bib_number NULLS LAST, roster_id
        )`;

    return sql`
      WITH scoped AS (
        SELECT
          ${eventRosters.id} AS roster_id,
          ${eventRosters.bibNumber} AS bib_number,
          ${eventRosters.firstName} AS first_name,
          ${eventRosters.lastName} AS last_name,
          ${eventRosters.userId} IS NOT NULL AS is_registered,
          ${eventDancerProfiles.profilePhotoUrl} AS profile_photo_url,
          COALESCE(${eventDancerProfiles.gpa}, ${dancerProfiles.gpa}) AS gpa,
          COALESCE(${eventDancerProfiles.gradYear}, ${dancerProfiles.gradYear}) AS grad_year,
          COALESCE(${eventDancerProfiles.studio}, ${dancerProfiles.studio}) AS studio,
          COALESCE(${eventDancerProfiles.state}, ${dancerProfiles.location}) AS state,
          ${interested} AS interested,
          ${isFavorited} AS is_favorited,
          ${rating} AS rating,
          ${hasNote} AS has_note,
          ${isCalledBack} AS is_called_back,
          ${users.username} AS username,
          ${eventRosters.userId} AS user_id,
          NULLIF(LOWER(TRIM(${eventRosters.email})), '') AS email_key,
          ${eventRosters.eventId} AS event_id,
          ${eventRosters.createdAt} AS created_at,
          ${onActiveEvent} AS on_active_event
        FROM ${eventRosters}
        LEFT JOIN ${eventDancerProfiles}
          ON ${eventDancerProfiles.rosterId} = ${eventRosters.id}
        LEFT JOIN ${dancerProfiles}
          ON ${dancerProfiles.userId} = ${eventRosters.userId}
        LEFT JOIN ${users} ON ${users.id} = ${eventRosters.userId}
        WHERE ${and(...filters)}
      ),
      ${deduped},
      shown AS (
        SELECT deduped.*,
          ${shownBib} AS shown_bib,
          TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) AS full_name
        FROM deduped
      )
    `;
  }

  /** The search box and filter tab, over what the coach sees on each row. */
  private matches(q: Validator) {
    const conditions: SQL[] = [sql`true`];
    if (q.search) {
      const pattern = likePattern(q.search);
      conditions.push(sql`(
        shown_bib::text LIKE ${pattern}
        OR full_name ILIKE ${pattern}
        OR studio ILIKE ${pattern}
      )`);
    }
    if (q.filter === "favorites") conditions.push(sql`is_favorited`);
    else if (q.filter === "calledBack") conditions.push(sql`is_called_back`);
    else if (q.filter === "rated")
      conditions.push(sql`COALESCE(rating, 0) > 0`);
    return sql.join(conditions, sql` AND `);
  }

  /** Blanks sort last in both directions; ties fall back to bib, then name. */
  private orderBy(q: Validator) {
    const tiebreak = sql`shown_bib ASC NULLS LAST, LOWER(full_name), roster_id`;
    if (q.sortBy === "rank") {
      // Rated dancers, best first: rating, then favourites, then bib.
      return sql`rating DESC NULLS LAST, is_favorited DESC, ${tiebreak}`;
    }
    const key = {
      bib: sql`shown_bib`,
      name: sql`LOWER(full_name)`,
      year: sql`grad_year`,
      studio: sql`LOWER(studio)`,
      gpa: sql`gpa`,
      rating: sql`rating`,
    }[q.sortBy ?? "bib"];
    const dir = q.sortDir === "desc" ? sql`DESC` : sql`ASC`;
    return sql`(${key}) IS NULL, ${key} ${dir}, ${tiebreak}`;
  }
}
