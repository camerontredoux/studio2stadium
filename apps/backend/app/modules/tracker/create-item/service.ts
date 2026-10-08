import { trackerItems } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { E_DATABASE_ERROR } from "#exceptions/database";
import { inject } from "@adonisjs/core";
import {
  assertSchoolExists,
  assertStage,
  findItems,
  toCalendarDate,
} from "../stages.ts";
import { Validator } from "./validator.ts";

export class AlreadyTrackingSchoolError extends Error {
  code = "E_ALREADY_TRACKING_SCHOOL";
  constructor() {
    super("This school is already in your tracker.");
  }
}

@inject()
export class CreateTrackerItemService {
  constructor(private db: DatabaseService) {}

  async execute(dancerId: string, input: Validator) {
    const stage = input.stage ?? 0;
    assertStage(input.type, stage);

    try {
      return await this.db.use(async (db) => {
        if (input.schoolId) await assertSchoolExists(db, input.schoolId);
        const [{ id }] = await db
          .insert(trackerItems)
          .values({
            dancerId,
            type: input.type,
            // A school item's title comes from the school.
            title: input.type === "school" ? null : input.title,
            schoolId: input.schoolId ?? null,
            date: input.date ? toCalendarDate(input.date) : null,
            notes: input.notes || null,
            stage,
          })
          .returning({ id: trackerItems.id });
        const [item] = await findItems(db, dancerId, id);
        return item;
      });
    } catch (error) {
      if (
        error instanceof E_DATABASE_ERROR &&
        error.code === "E_UNIQUE_VIOLATION"
      ) {
        throw new AlreadyTrackingSchoolError();
      }
      throw error;
    }
  }
}
