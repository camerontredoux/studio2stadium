import { trackerItems, trackerSectionOrders } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { desc, eq } from "drizzle-orm";
import { itemFields } from "../stages.ts";

@inject()
export class ListTrackerItemsService {
  constructor(private db: DatabaseService) {}

  async execute(dancerId: string) {
    const [items, [order]] = await Promise.all([
      this.db.use((db) =>
        db
          .select(itemFields)
          .from(trackerItems)
          .where(eq(trackerItems.dancerId, dancerId))
          .orderBy(desc(trackerItems.createdAt), desc(trackerItems.id))
      ),
      this.db.use((db) =>
        db
          .select({ sections: trackerSectionOrders.sections })
          .from(trackerSectionOrders)
          .where(eq(trackerSectionOrders.dancerId, dancerId))
      ),
    ]);

    return { items, sectionOrder: order?.sections ?? [] };
  }
}
