import { DatabaseService } from "#database/service";
import { eventShowcases } from "#database/schema/event-features";
import { inject } from "@adonisjs/core";
import { and, eq, sql } from "drizzle-orm";

@inject()
export class StartNextShowcaseService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string) {
    return this.db.tx(async (tx) => {
      const [current] = await tx
        .select()
        .from(eventShowcases)
        .where(
          and(
            eq(eventShowcases.eventId, eventId),
            eq(eventShowcases.status, "published")
          )
        )
        .orderBy(sql`${eventShowcases.number} DESC`)
        .limit(1);

      if (!current) {
        throw new Error("No published showcase to follow");
      }

      const active = await tx
        .select()
        .from(eventShowcases)
        .where(
          and(
            eq(eventShowcases.eventId, eventId),
            eq(eventShowcases.status, "active")
          )
        )
        .limit(1);

      if (active.length > 0) {
        throw new Error("An active showcase already exists");
      }

      const [next] = await tx
        .insert(eventShowcases)
        .values({
          eventId,
          number: current.number + 1,
          status: "active",
        })
        .returning();

      return next!;
    });
  }
}
