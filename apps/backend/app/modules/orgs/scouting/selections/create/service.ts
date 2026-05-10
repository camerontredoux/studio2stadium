import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventSchoolSelections } from "#database/schema/event-features";
import { and, eq, sql } from "drizzle-orm";

@inject()
export class CreateSelectionService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    dancerRosterId: string,
    coachRosterId: string
  ) {
    const [countRow] = await this.db.use((db) =>
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(eventSchoolSelections)
        .where(
          and(
            eq(eventSchoolSelections.eventId, eventId),
            eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
          )
        )
    );

    if (countRow.count >= 3) {
      return { error: "max_selections" as const };
    }

    const [row] = await this.db.use((db) =>
      db
        .insert(eventSchoolSelections)
        .values({ eventId, dancerRosterId, coachRosterId })
        .onConflictDoNothing()
        .returning()
    );

    if (row) return { data: row };

    const [existing] = await this.db.use((db) =>
      db
        .select()
        .from(eventSchoolSelections)
        .where(
          and(
            eq(eventSchoolSelections.eventId, eventId),
            eq(eventSchoolSelections.dancerRosterId, dancerRosterId),
            eq(eventSchoolSelections.coachRosterId, coachRosterId)
          )
        )
        .limit(1)
    );
    return { data: existing };
  }
}
