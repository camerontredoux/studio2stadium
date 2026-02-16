import { images, videos } from "#database/schema/media";
import { favorites, follows } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(type: "dancer" | "school", profileId: string) {
    if (type === "dancer") {
      return await this.db.use((db) =>
        db.query.dancerProfiles.findFirst({
          where: {
            id: profileId,
          },
          columns: {},
          extras: {
            videos: (table) =>
              db.$count(videos, eq(videos.userId, table.userId)),
            images: (table) =>
              db.$count(images, eq(images.userId, table.userId)),
            followers: (table) =>
              db.$count(favorites, eq(favorites.dancerId, table.id)),
            following: (table) =>
              db.$count(follows, eq(follows.dancerId, table.id)),
          },
        })
      );
    }

    return await this.db.use((db) =>
      db.query.schoolProfiles.findFirst({
        where: {
          id: profileId,
        },
        columns: {},
        extras: {
          videos: (table) => db.$count(videos, eq(videos.userId, table.userId)),
          images: (table) => db.$count(images, eq(images.userId, table.userId)),
          followers: (table) =>
            db.$count(follows, eq(follows.schoolId, table.id)),
          following: (table) =>
            db.$count(favorites, eq(favorites.schoolId, table.id)),
        },
      })
    );
  }
}
