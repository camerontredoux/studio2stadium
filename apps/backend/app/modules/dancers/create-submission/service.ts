import { crvSubmissions, crvVideos } from "#database/schema/crv";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string, data: Validator) {
    await this.db.tx(async (tx) => {
      await tx
        .insert(crvVideos)
        .values({
          dancerId: profileId,
          youtubeId: data.videoId,
        })
        .onConflictDoUpdate({
          target: crvVideos.dancerId,
          set: {
            youtubeId: data.videoId,
          },
        });

      await tx.insert(crvSubmissions).values(
        data.schoolId.map((schoolId) => ({
          dancerId: profileId,
          schoolId,
          videoId: data.videoId,
        }))
      );
    });
  }
}
