import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters } from "#database/schema/org-events";
import {
  eventFavorites,
  eventNotes,
  eventRatings,
} from "#database/schema/event-features";
import { and, eq, sql } from "drizzle-orm";
import { ListDancersService } from "../list/service.ts";
import type { Validator } from "../list/validator.ts";
import type { ScoutingViewScope } from "../../view-scope.ts";

/** How many states the talent pool names; the rest are only counted. */
export const TOP_STATES = 5;

/** How many of the coach's latest marks the activity feed shows. */
export const ACTIVITY_LIMIT = 5;

/**
 * The roster's GPA ranges, lowest first: at least `min`, under `below`. The
 * keys match the frontend's GPA filter, so a band can open that filter.
 */
export const GPA_BANDS = [
  { key: "under-2.5", below: 2.5 },
  { key: "2.5-3.0", min: 2.5, below: 3 },
  { key: "3.0-3.5", min: 3, below: 3.5 },
  { key: "3.5-4.0", min: 3.5, below: 4 },
  { key: "4.0+", min: 4 },
] as const satisfies { key: string; min?: number; below?: number }[];

type Counts = {
  all: number;
  reviewed: number;
  toReview: number;
  matching: number;
  matchingToReview: number;
  favorites: number;
  calledBack: number;
} & Record<`gpa${number}`, number>;

type Activity = {
  type: "favorite" | "rate" | "note";
  rosterId: string;
  firstName: string;
  lastName: string;
  bibNumber: number | null;
  rating: number | null;
  at: Date | string;
};

@inject()
export class SummarizeDancersService {
  constructor(
    private db: DatabaseService = new DatabaseService(),
    private list: ListDancersService = new ListDancersService()
  ) {}

  /**
   * The aggregates the coach's roster sidebar shows, over every dancer the
   * list would show (not one page): how many the coach has reviewed (favorited,
   * rated or noted), how many match the filters, the talent pool by year, GPA
   * band and state, and the coach's latest marks on the event.
   */
  async execute(
    orgId: string,
    activeEventId: string | null,
    view: ScoutingViewScope | null,
    q: Validator,
    selectedEventId?: string
  ) {
    const shown = this.list.shownDancers(
      orgId,
      activeEventId,
      view,
      q,
      false,
      selectedEventId
    );
    const matches = this.list.matches(q);
    const reviewed = sql`(is_favorited OR COALESCE(rating, 0) > 0 OR has_note)`;
    const bandCounts = GPA_BANDS.map((band, index) => {
      const conditions = [sql`gpa IS NOT NULL`];
      if ("min" in band) conditions.push(sql`gpa >= ${band.min}`);
      if ("below" in band) conditions.push(sql`gpa < ${band.below}`);
      return sql`(count(*) FILTER (WHERE ${sql.join(conditions, sql` AND `)}))::int AS ${sql.identifier(`gpa${index}`)}`;
    });

    const [[counts], years, states, activity] = await this.db.use((db) =>
      Promise.all([
        db.execute<Counts>(sql`
          ${shown}
          SELECT
            count(*)::int AS "all",
            (count(*) FILTER (WHERE ${reviewed}))::int AS reviewed,
            (count(*) FILTER (WHERE NOT ${reviewed}))::int AS "toReview",
            (count(*) FILTER (WHERE ${matches}))::int AS matching,
            (count(*) FILTER (WHERE ${matches} AND NOT ${reviewed}))::int AS "matchingToReview",
            (count(*) FILTER (WHERE is_favorited))::int AS favorites,
            (count(*) FILTER (WHERE is_called_back))::int AS "calledBack",
            ${sql.join(bandCounts, sql`, `)}
          FROM shown
        `),
        db.execute<{ year: number; count: number }>(sql`
          ${shown}
          SELECT grad_year AS year, count(*)::int AS count
          FROM shown
          WHERE grad_year IS NOT NULL
          GROUP BY grad_year
          ORDER BY grad_year
        `),
        db.execute<{ state: string; count: number }>(sql`
          ${shown}
          SELECT UPPER(TRIM(state)) AS state, count(*)::int AS count
          FROM shown
          WHERE NULLIF(TRIM(state), '') IS NOT NULL
          GROUP BY UPPER(TRIM(state))
          ORDER BY count DESC, state
        `),
        this.activity(view),
      ])
    );

    const count = (key: keyof Counts) => counts?.[key] ?? 0;
    return {
      counts: {
        all: count("all"),
        reviewed: count("reviewed"),
        toReview: count("toReview"),
        matching: count("matching"),
        matchingToReview: count("matchingToReview"),
        favorites: count("favorites"),
        calledBack: count("calledBack"),
      },
      talentPool: {
        years: [...years],
        gpa: GPA_BANDS.map((band, index) => ({
          key: band.key,
          count: count(`gpa${index}`),
        })),
        states: [...states].slice(0, TOP_STATES),
        otherStates: Math.max(0, states.length - TOP_STATES),
      },
      activity,
    };
  }

  /**
   * The coach's latest favorites, ratings and notes on the viewed event,
   * newest first. Unfavoriting or clearing a mark removes it from the feed.
   */
  private async activity(view: ScoutingViewScope | null) {
    if (!view?.coachRosterId) return [];
    const marks = (
      table: typeof eventFavorites | typeof eventRatings | typeof eventNotes
    ) =>
      and(
        eq(table.eventId, view.eventId),
        eq(table.coachRosterId, view.coachRosterId!)
      );

    const rows = await this.db.use((db) =>
      db.execute<Activity>(sql`
        SELECT kind AS type, ${eventRosters.id} AS "rosterId",
          ${eventRosters.firstName} AS "firstName",
          ${eventRosters.lastName} AS "lastName",
          ${eventRosters.bibNumber} AS "bibNumber",
          rating, at
        FROM (
          SELECT 'favorite' AS kind, ${eventFavorites.dancerRosterId} AS roster_id,
            NULL::smallint AS rating, ${eventFavorites.createdAt} AS at
          FROM ${eventFavorites} WHERE ${marks(eventFavorites)}
          UNION ALL
          SELECT 'rate', ${eventRatings.dancerRosterId}, ${eventRatings.rating},
            ${eventRatings.updatedAt}
          FROM ${eventRatings} WHERE ${marks(eventRatings)}
          UNION ALL
          SELECT 'note', ${eventNotes.dancerRosterId}, NULL, ${eventNotes.updatedAt}
          FROM ${eventNotes} WHERE ${marks(eventNotes)}
        ) marks
        JOIN ${eventRosters} ON ${eventRosters.id} = marks.roster_id
        ORDER BY at DESC, kind
        LIMIT ${ACTIVITY_LIMIT}
      `)
    );
    return [...rows].map((row) => ({
      ...row,
      eventId: view.eventId,
      at: new Date(row.at).toISOString(),
    }));
  }
}
