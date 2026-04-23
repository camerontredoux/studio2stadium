import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventSchoolSelections } from "#database/schema/event-features";
import { eventRosters } from "#database/schema/org-events";
import { and, eq } from "drizzle-orm";

@inject()
export class ListSelectionsService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, dancerRosterId: string) {
    return this.db.use((db) =>
      db
        .select({
          id: eventSchoolSelections.id,
          coachRosterId: eventSchoolSelections.coachRosterId,
          organization: eventRosters.organization,
          createdAt: eventSchoolSelections.createdAt,
        })
        .from(eventSchoolSelections)
        .innerJoin(
          eventRosters,
          eq(eventRosters.id, eventSchoolSelections.coachRosterId)
        )
        .where(
          and(
            eq(eventSchoolSelections.eventId, eventId),
            eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
          )
        )
        .orderBy(eventSchoolSelections.createdAt)
    );
  }
}
