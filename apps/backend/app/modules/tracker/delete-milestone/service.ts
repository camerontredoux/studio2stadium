import { trackerMilestones } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { ownedMilestone } from "../milestones.ts";
import { Validator } from "./validator.ts";

@inject()
export class DeleteTrackerMilestoneService {
  constructor(private db: DatabaseService) {}

  /** Returns false when the milestone doesn't exist or isn't the dancer's. */
  async execute(dancerId: string, { params }: Validator) {
    const deleted = await this.db.use((db) =>
      db
        .delete(trackerMilestones)
        .where(ownedMilestone(dancerId, params.id))
        .returning({ id: trackerMilestones.id })
    );
    return deleted.length > 0;
  }
}
