import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventSchoolSelections } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";
import { closeRankGap, lockDancerSelections } from "../rank.ts";

@inject()
export class DeleteSelectionService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  /** Removes one of the dancer's selections and moves the lower-ranked ones up. */
  async execute(eventId: string, dancerRosterId: string, selectionId: string) {
    return this.db.tx(async (tx) => {
      await lockDancerSelections(tx, dancerRosterId);
      const [row] = await tx
        .delete(eventSchoolSelections)
        .where(
          and(
            eq(eventSchoolSelections.id, selectionId),
            eq(eventSchoolSelections.eventId, eventId),
            eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
          )
        )
        .returning();
      if (!row) return null;

      await closeRankGap(tx, eventId, dancerRosterId, row.rank);
      return row;
    });
  }
}
