import { DatabaseService } from "#database/service";
import { eventShowcases } from "#database/schema/event-features";
import { inject } from "@adonisjs/core";
import { and, eq, sql } from "drizzle-orm";

@inject()
export class EnsureActiveShowcaseService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string) {
    const [existing] = await this.db.use((db) =>
      db
        .select()
        .from(eventShowcases)
        .where(
          and(
            eq(eventShowcases.eventId, eventId),
            eq(eventShowcases.status, "active")
          )
        )
        .limit(1)
    );

    if (existing) return existing;

    const maxNumber = await this.db.use((db) =>
      db
        .select({ max: sql<number>`COALESCE(MAX(${eventShowcases.number}), 0)` })
        .from(eventShowcases)
        .where(eq(eventShowcases.eventId, eventId))
    );

    const nextNumber = Number(maxNumber[0]?.max ?? 0) + 1;

    const [row] = await this.db.use((db) =>
      db
        .insert(eventShowcases)
        .values({ eventId, number: nextNumber, status: "active" })
        .onConflictDoNothing()
        .returning()
    );

    if (row) return row;

    const [raced] = await this.db.use((db) =>
      db
        .select()
        .from(eventShowcases)
        .where(
          and(
            eq(eventShowcases.eventId, eventId),
            eq(eventShowcases.status, "active")
          )
        )
        .limit(1)
    );
    return raced!;
  }
}
