import { programViews } from "#database/schema/profiles";
import { schoolProfiles } from "#database/schema/schools";
import { DatabaseService } from "#database/service";
import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  // Idempotent: only the first view of each school is kept.
  async execute(dancerId: string, { params }: Validator) {
    await this.db.use(async (db) => {
      const [school] = await db
        .select({ id: schoolProfiles.id })
        .from(schoolProfiles)
        .where(eq(schoolProfiles.id, params.id));
      if (!school) throw new E_NOT_FOUND("School not found");

      await db
        .insert(programViews)
        .values({ dancerId, schoolId: params.id })
        .onConflictDoNothing();
    });
  }
}
