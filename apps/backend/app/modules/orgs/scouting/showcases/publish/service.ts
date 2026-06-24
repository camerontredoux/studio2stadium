import { DatabaseService } from "#database/service";
import {
  eventCallbacks,
  eventRatings,
  eventShowcases,
  publishedCallbacks,
} from "#database/schema/event-features";
import { inject } from "@adonisjs/core";
import { and, eq, sql } from "drizzle-orm";

@inject()
export class PublishShowcaseService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, showcaseId: string) {
    return this.db.tx(async (tx) => {
      const [showcase] = await tx
        .select()
        .from(eventShowcases)
        .where(eq(eventShowcases.id, showcaseId))
        .limit(1);

      if (!showcase || showcase.status !== "active") {
        throw new Error("Showcase is not active");
      }

      const callbacks = await tx
        .select({
          coachRosterId: eventCallbacks.coachRosterId,
          dancerRosterId: eventCallbacks.dancerRosterId,
          createdAt: eventCallbacks.createdAt,
          rating: eventRatings.rating,
        })
        .from(eventCallbacks)
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
            sql`NOT EXISTS (
              SELECT 1 FROM event_rosters cr
              WHERE cr.id = ${eventCallbacks.coachRosterId} AND cr.is_staff = true
            )`,
            sql`NOT EXISTS (
              SELECT 1 FROM event_rosters dr
              WHERE dr.id = ${eventCallbacks.dancerRosterId} AND dr.is_staff = true
            )`
          )
        );

      const grouped = new Map<string, typeof callbacks>();
      for (const cb of callbacks) {
        const list = grouped.get(cb.coachRosterId) ?? [];
        list.push(cb);
        grouped.set(cb.coachRosterId, list);
      }

      const rows: {
        showcaseId: string;
        coachRosterId: string;
        dancerRosterId: string;
        rank: number;
      }[] = [];

      for (const [coachRosterId, cbs] of grouped) {
        cbs.sort((a, b) => {
          const rA = a.rating ?? -1;
          const rB = b.rating ?? -1;
          if (rB !== rA) return rB - rA;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        const top5 = cbs.slice(0, 5);
        for (const [i, element] of top5.entries()) {
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
    });
  }
}
