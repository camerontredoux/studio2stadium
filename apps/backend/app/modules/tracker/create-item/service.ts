import { trackerItems } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { E_DATABASE_ERROR } from "#exceptions/database";
import { inject } from "@adonisjs/core";
import { assertStage, itemFields, toCalendarDate } from "../stages.ts";
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
      const [item] = await this.db.use((db) =>
        db
          .insert(trackerItems)
          .values({
            dancerId,
            type: input.type,
            title: input.type === "school" ? input.school! : input.title!,
            school: input.school ?? null,
            date: input.date ? toCalendarDate(input.date) : null,
            notes: input.notes || null,
            stage,
          })
          .returning(itemFields)
      );
      return item;
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
