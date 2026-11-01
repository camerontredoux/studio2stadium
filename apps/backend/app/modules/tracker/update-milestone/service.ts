import { trackerMilestones } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { sql } from "drizzle-orm";
import { milestoneFields, ownedMilestone } from "../milestones.ts";
import { Validator } from "./validator.ts";

@inject()
export class UpdateTrackerMilestoneService {
  constructor(private db: DatabaseService) {}

  /** Returns null when the milestone doesn't exist or isn't the dancer's. */
  async execute(dancerId: string, { params, title, completed }: Validator) {
    const [milestone] = await this.db.use((db) =>
      db
        .update(trackerMilestones)
        .set({
          title,
          // Completing keeps the original time if it was already complete.
          completedAt:
            completed === undefined
              ? undefined
              : completed
                ? sql`coalesce(${trackerMilestones.completedAt}, now())`
                : null,
          updatedAt: new Date(),
        })
        .where(ownedMilestone(dancerId, params.id))
        .returning(milestoneFields)
    );
    return milestone ?? null;
  }
}
