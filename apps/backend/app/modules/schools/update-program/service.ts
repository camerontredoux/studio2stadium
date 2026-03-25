import { schoolProfiles } from "#database/schema/schools";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { type UpdateProgramSchema } from "./validator.ts";

@inject()
export class UpdateProgramService {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: UpdateProgramSchema) {
    const { schoolName, ...rest } = data;
    const setData = {
      ...rest,
      ...(schoolName !== undefined ? { name: schoolName } : {}),
    };

    await this.db.use((db) =>
      db
        .update(schoolProfiles)
        .set(setData)
        .where(eq(schoolProfiles.id, profileId))
    );
  }
}
