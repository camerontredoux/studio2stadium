import { crvVideos } from "#database/schema/crv";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(dancerId: string, data: Validator) {
    await this.db.use((db) =>
      db
        .update(crvVideos)
        .set({ youtubeId: data.videoId })
        .where(eq(crvVideos.dancerId, dancerId))
    );
  }
}
