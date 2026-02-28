import { schoolProfiles } from "#database/schema/schools";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type UpdateProgramSchema } from "./validator.ts";

@inject()
export class UpdateProgramService {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: UpdateProgramSchema) {
    await this.db.use((db) =>
      db
        .update(schoolProfiles)
        .set(data)
        .where(eq(schoolProfiles.id, profileId))
    );
  }
}
