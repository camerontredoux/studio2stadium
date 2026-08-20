import { DatabaseService, type Transaction } from "#database/service";
import { db as database } from "#database/connection";
import {
  eventCallbacks,
  eventRatings,
  eventShowcases,
  publishedCallbacks,
} from "#database/schema/event-features";
import { eventRosters } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, eq, sql } from "drizzle-orm";

interface EligibleCallback {
  coachRosterId: string;
  coachFirstName: string;
  coachLastName: string;
  coachOrganization: string | null;
  dancerRosterId: string;
  createdAt: Date | string;
  rating: number | null;
}

type Executor = typeof database | Transaction;

/**
 * Every non-staff callback in a showcase, with the calling coach's identity and
 * that coach's rating of the dancer (used for ranking at publish time).
 */
function eligibleCallbacksQuery(
  db: Executor,
  eventId: string,
  showcaseId: string
) {
  return db
    .select({
      coachRosterId: eventCallbacks.coachRosterId,
      coachFirstName: eventRosters.firstName,
      coachLastName: eventRosters.lastName,
      coachOrganization: eventRosters.organization,
      dancerRosterId: eventCallbacks.dancerRosterId,
      createdAt: eventCallbacks.createdAt,
      rating: eventRatings.rating,
    })
    .from(eventCallbacks)
    .innerJoin(eventRosters, eq(eventRosters.id, eventCallbacks.coachRosterId))
    .leftJoin(
      eventRatings,
      and(
        eq(eventRatings.eventId, eventId),
        eq(eventRatings.coachRosterId, eventCallbacks.coachRosterId),
        eq(eventRatings.dancerRosterId, eventCallbacks.dancerRosterId)
      )
    )
    .where(
      and(
        eq(eventCallbacks.showcaseId, showcaseId),
        // Never publish staff-sandbox callbacks (preview coach or dancer).
        eq(eventRosters.isStaff, false),
        sql`NOT EXISTS (
          SELECT 1 FROM event_rosters dr
          WHERE dr.id = ${eventCallbacks.dancerRosterId} AND dr.is_staff = true
        )`
      )
    );
}

/**
 * Group by coach, then rank each coach's callbacks the way publish does:
 * that coach's rating first, most recent callback as the tiebreaker.
 */
function rankByCoach(callbacks: EligibleCallback[]) {
  const grouped = new Map<string, EligibleCallback[]>();
  for (const cb of callbacks) {
    const list = grouped.get(cb.coachRosterId) ?? [];
    list.push(cb);
    grouped.set(cb.coachRosterId, list);
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => {
      const rA = a.rating ?? -1;
      const rB = b.rating ?? -1;
      if (rB !== rA) return rB - rA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  return grouped;
}

@inject()
export class PublishShowcaseService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  /**
   * What publishing would do at the given cap, without writing anything —
   * so admins can see whose callbacks the cap is about to drop.
   */
  async preview(eventId: string, showcaseId: string, maxCallbacks = 5) {
    const callbacks: EligibleCallback[] = await this.db.use((db) =>
      eligibleCallbacksQuery(db, eventId, showcaseId)
    );

    const grouped = rankByCoach(callbacks);
    const coaches = [...grouped.entries()].map(([coachRosterId, cbs]) => {
      const first = cbs[0]!;
      const willPublish =
        maxCallbacks === -1 ? cbs.length : Math.min(cbs.length, maxCallbacks);
      return {
        coachRosterId,
        firstName: first.coachFirstName,
        lastName: first.coachLastName,
        organization: first.coachOrganization,
        total: cbs.length,
        willPublish,
        willDrop: cbs.length - willPublish,
      };
    });

    coaches.sort((a, b) => b.willDrop - a.willDrop || b.total - a.total);

    return {
      maxCallbacks,
      totalCallbacks: callbacks.length,
      totalWillPublish: coaches.reduce((sum, c) => sum + c.willPublish, 0),
      totalWillDrop: coaches.reduce((sum, c) => sum + c.willDrop, 0),
      coachesOverCap: coaches.filter((c) => c.willDrop > 0).length,
      coaches,
    };
  }

  async execute(eventId: string, showcaseId: string, maxCallbacks = 5) {
    return this.db.tx(async (tx) => {
      const [showcase] = await tx
        .select()
        .from(eventShowcases)
        .where(eq(eventShowcases.id, showcaseId))
        .limit(1);

      if (!showcase || showcase.status !== "active") {
        throw new Error("Showcase is not active");
      }

      const callbacks: EligibleCallback[] = await eligibleCallbacksQuery(
        tx,
        eventId,
        showcaseId
      );

      const grouped = rankByCoach(callbacks);

      const rows: {
        showcaseId: string;
        coachRosterId: string;
        dancerRosterId: string;
        rank: number;
      }[] = [];

      for (const [coachRosterId, cbs] of grouped) {
        const selected = maxCallbacks === -1 ? cbs : cbs.slice(0, maxCallbacks);
        for (const [i, element] of selected.entries()) {
          rows.push({
            showcaseId,
            coachRosterId,
            dancerRosterId: element!.dancerRosterId,
            rank: i + 1,
          });
        }
      }

      if (rows.length > 0) {
        await tx.insert(publishedCallbacks).values(rows);
      }

      await tx
        .update(eventShowcases)
        .set({
          status: "published",
          publishedAt: sql`NOW()`,
        })
        .where(eq(eventShowcases.id, showcaseId));

      return { publishedCount: rows.length, totalCallbacks: callbacks.length };
    });
  }
}
