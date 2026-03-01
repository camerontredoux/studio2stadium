import { schoolApplications } from "#database/schema/schools";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { type SubmitApplicationSchema } from "./schema.ts";

@inject()
export class SubmitApplicationService {
  constructor(private db: DatabaseService) {}

  async execute(schoolId: string, data: SubmitApplicationSchema) {
    await this.db.use((db) =>
      db.insert(schoolApplications).values({ ...data, schoolId })
    );
  }
}
