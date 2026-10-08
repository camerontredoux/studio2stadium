import { trackerSectionOrders } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { findItems } from "../stages.ts";

@inject()
export class ListTrackerItemsService {
  constructor(private db: DatabaseService) {}

  async execute(dancerId: string) {
    const [items, [order]] = await Promise.all([
      this.db.use((db) => findItems(db, dancerId)),
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
