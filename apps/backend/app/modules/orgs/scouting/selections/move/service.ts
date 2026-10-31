import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventSchoolSelections } from "#database/schema/event-features";
import { and, asc, eq } from "drizzle-orm";
import { lockDancerSelections, swapRanks } from "../rank.ts";
import { ListSelectionsService } from "../list/service.ts";

export type MoveDirection = "up" | "down";

@inject()
export class MoveSelectionService {
  constructor(
    private db: DatabaseService = new DatabaseService(),
    private list: ListSelectionsService = new ListSelectionsService()
  ) {}

  /**
   * Swaps a selection with its neighbour above or below, then returns the
   * dancer's selections in their new order.
   */
  async execute(
    eventId: string,
    dancerRosterId: string,
    selectionId: string,
    direction: MoveDirection
  ) {
    const result = await this.db.tx(async (tx) => {
      await lockDancerSelections(tx, dancerRosterId);
      const rows = await tx
        .select({
          id: eventSchoolSelections.id,
          rank: eventSchoolSelections.rank,
        })
        .from(eventSchoolSelections)
        .where(
          and(
            eq(eventSchoolSelections.eventId, eventId),
            eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
          )
        )
        .orderBy(asc(eventSchoolSelections.rank));

      const index = rows.findIndex((row) => row.id === selectionId);
      if (index === -1) return { error: "not_found" as const };
      const neighbour = rows[direction === "up" ? index - 1 : index + 1];
      if (!neighbour) return { error: "at_edge" as const };

      await swapRanks(tx, rows[index]!, neighbour);
      return null;
    });

    if (result) return result;
    return { data: await this.list.execute(eventId, dancerRosterId) };
  }
}
