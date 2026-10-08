import { trackerMilestones } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { milestoneFields } from "../milestones.ts";
import { assertSchoolExists } from "../stages.ts";
import { Validator } from "./validator.ts";

@inject()
export class CreateTrackerMilestoneService {
  constructor(private db: DatabaseService) {}

  async execute(dancerId: string, input: Validator) {
    return await this.db.use(async (db) => {
      await assertSchoolExists(db, input.schoolId);
      const [milestone] = await db
        .insert(trackerMilestones)
        .values({ dancerId, schoolId: input.schoolId, title: input.title })
        .returning(milestoneFields);
      return milestone;
    });
  }
}
