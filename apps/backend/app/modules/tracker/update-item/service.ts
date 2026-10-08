import { trackerItems } from "#database/schema/tracker";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { errors } from "@vinejs/vine";
import { and, eq } from "drizzle-orm";
import {
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
export class UpdateTrackerItemService {
  constructor(private db: DatabaseService) {}

  /** Returns null when the item doesn't exist or isn't the dancer's. */
  async execute(dancerId: string, { params, ...changes }: Validator) {
    const owned = and(
      eq(trackerItems.id, params.id),
      eq(trackerItems.dancerId, dancerId)
    );

    try {
      return await this.db.use(async (db) => {
        const [existing] = await db
          .select({ type: trackerItems.type })
          .from(trackerItems)
          .where(owned);
        if (!existing) return null;

        if (changes.stage !== undefined) {
          assertStage(existing.type, changes.stage);
        }

        const isSchool = existing.type === "school";
        if (isSchool && changes.schoolId === null) {
          throw new errors.E_VALIDATION_ERROR([
            {
              field: "schoolId",
              rule: "required",
              message: "The schoolId field is required for a school item",
            },
          ]);
        }
        if (changes.schoolId) await assertSchoolExists(db, changes.schoolId);
        if (isSchool && changes.stage === COMMITTED) {
          await assertNotCommitted(db, dancerId, params.id);
        }

        await db
          .update(trackerItems)
          .set({
            // A school item's title always comes from the school.
            title: isSchool ? undefined : changes.title,
            schoolId: changes.schoolId,
            date:
              changes.date === undefined
                ? undefined
                : changes.date && toCalendarDate(changes.date),
            notes:
              changes.notes === undefined ? undefined : changes.notes || null,
            stage: changes.stage,
            updatedAt: new Date(),
          })
          .where(owned);

        const [item] = await findItems(db, dancerId, params.id);
        return item ?? null;
      });
    } catch (error) {
      throw conflictError(error);
    }
  }
}
