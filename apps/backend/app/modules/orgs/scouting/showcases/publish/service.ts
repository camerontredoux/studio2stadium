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
        .where(eq(eventCallbacks.showcaseId, showcaseId));

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
        for (let i = 0; i < top5.length; i++) {
          rows.push({
            showcaseId,
            coachRosterId,
            dancerRosterId: top5[i]!.dancerRosterId,
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
