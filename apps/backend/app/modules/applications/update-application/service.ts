import { schoolApplications } from "#database/schema/schools";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type UpdateApplicationSchema } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(schoolId: string, data: UpdateApplicationSchema) {
    await this.db.use((db) =>
      db
        .update(schoolApplications)
        .set(data)
        .where(eq(schoolApplications.schoolId, schoolId))
    );
  }
}
