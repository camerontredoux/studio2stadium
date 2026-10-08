import { trackerItems } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import {
  assertEventFits,
  assertNotCommitted,
  assertSchoolExists,
  assertStage,
  COMMITTED,
  conflictError,
  findItems,
  toCalendarDate,
} from "../stages.ts";
import { Validator } from "./validator.ts";

@inject()
export class CreateTrackerItemService {
  constructor(private db: DatabaseService) {}

  async execute(dancerId: string, input: Validator) {
    const stage = input.stage ?? 0;
    assertStage(input.type, stage);

    try {
      return await this.db.use(async (db) => {
        if (input.schoolId) await assertSchoolExists(db, input.schoolId);
        if (input.eventId) {
          await assertEventFits(
            db,
            input.type,
            input.eventId,
            input.schoolId ?? null
          );
        }
        if (input.type === "school" && stage === COMMITTED) {
          await assertNotCommitted(db, dancerId);
        }
        const [{ id }] = await db
          .insert(trackerItems)
          .values({
            dancerId,
            type: input.type,
            // A school item's title comes from the school.
            title: input.type === "school" ? null : input.title,
            schoolId: input.schoolId ?? null,
            eventId: input.eventId ?? null,
            date: input.date ? toCalendarDate(input.date) : null,
            notes: input.notes || null,
            stage,
          })
          .returning({ id: trackerItems.id });
        const [item] = await findItems(db, dancerId, id);
        return item;
      });
    } catch (error) {
      throw conflictError(error);
    }
  }
}
