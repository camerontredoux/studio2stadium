import { interests } from "#database/schema/index";
import { DatabaseService } from "#database/service";
import { E_DATABASE_ERROR } from "#exceptions/database";
import { inject } from "@adonisjs/core";
import { sql } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator, profileId: string) {
    try {
      await this.db.use((db) =>
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
      );
    } catch (error) {
      if (error instanceof E_DATABASE_ERROR) {
        if (error.code === "E_CHECK_CONSTRAINT_VIOLATION") {
          return { created: false };
        }
      }
      throw error;
    }

    return { created: true };
  }
}
