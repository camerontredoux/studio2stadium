import { crvSubmissions } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    return await this.db.use((db) =>
      db
        .insert(crvSubmissions)
        .values(
          data.schoolId.map((schoolId) => ({
            dancerId: profileId,
            schoolId,
            videoId: data.videoId,
          }))
        )
        .onConflictDoUpdate({
          target: [crvSubmissions.dancerId, crvSubmissions.schoolId],
          set: {
            videoId: data.videoId,
          },
        })
    );
  }
}
