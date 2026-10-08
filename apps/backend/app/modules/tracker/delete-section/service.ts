import { trackerItems, trackerMilestones } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class DeleteTrackerSectionService {
  constructor(private db: DatabaseService) {}

  // Removes the school, its milestones, and everything the dancer tracks
  // under it.
  async execute(dancerId: string, { schoolId }: Validator) {
    await this.db.tx(async (tx) => {
      await tx
        .delete(trackerMilestones)
        .where(
          and(
            eq(trackerMilestones.dancerId, dancerId),
            eq(trackerMilestones.schoolId, schoolId)
          )
        );
      await tx
        .delete(trackerItems)
        .where(
          and(
            eq(trackerItems.dancerId, dancerId),
            eq(trackerItems.schoolId, schoolId)
          )
        );
    });
  }
}
