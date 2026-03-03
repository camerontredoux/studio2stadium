import { interests } from "#database/schema/index";
import { DatabaseService } from "#database/service";
import { E_DATABASE_ERROR } from "#exceptions/database";
import { inject } from "@adonisjs/core";
import { sql } from "drizzle-orm";
import { ShowInterestEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator, profileId: string, isAdmin?: boolean) {
    let interestCount = 1;

    try {
      const [result] = await this.db.use((db) =>
        db
          .insert(interests)
          .values({
            dancerId: profileId,
            schoolId: params.id,
          })
          .onConflictDoUpdate({
            target: [interests.dancerId, interests.schoolId],
            set: {
              count: sql`${interests.count} + 1`,
            },
          })
          .returning({ count: interests.count })
      );
      interestCount = result.count;
    } catch (error) {
      if (error instanceof E_DATABASE_ERROR) {
        if (error.code === "E_CHECK_CONSTRAINT_VIOLATION") {
          return { created: false };
        }
      }
      throw error;
    }

    ShowInterestEvent.dispatch({
      dancerId: profileId,
      schoolId: params.id,
      interestCount,
      isAdmin,
    });

    return { created: true };
  }
}
