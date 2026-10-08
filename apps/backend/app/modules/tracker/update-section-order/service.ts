import { trackerSectionOrders } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class UpdateTrackerSectionOrderService {
  constructor(private db: DatabaseService) {}

  async execute(dancerId: string, { sections }: Validator) {
    await this.db.use((db) =>
      db
        .insert(trackerSectionOrders)
        .values({ dancerId, sections })
        .onConflictDoUpdate({
          target: trackerSectionOrders.dancerId,
          set: { sections, updatedAt: new Date() },
        })
    );
  }
}
