import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventSchoolSelections } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";
import { lockDancerSelections } from "../rank.ts";

@inject()
export class CreateSelectionService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  /** Adds a school as the dancer's lowest-ranked choice; re-adding one returns it unchanged. */
  async execute(
    eventId: string,
    dancerRosterId: string,
    coachRosterId: string,
    maxSelections = 3
  ) {
    return this.db.tx(async (tx) => {
      await lockDancerSelections(tx, dancerRosterId);
      const current = await tx
        .select()
        .from(eventSchoolSelections)
        .where(
          and(
            eq(eventSchoolSelections.eventId, eventId),
            eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
          )
        );

      const existing = current.find(
        (row) => row.coachRosterId === coachRosterId
      );
      if (existing) return { data: existing };

      if (maxSelections !== -1 && current.length >= maxSelections) {
        return { error: "max_selections" as const };
      }

      const [row] = await tx
        .insert(eventSchoolSelections)
        .values({
          eventId,
          dancerRosterId,
          coachRosterId,
          rank: current.length + 1,
        })
        .returning();
      return { data: row! };
    });
  }
}
