import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const followers = await this.db.use((db) =>
      db.query.schoolProfiles.findMany({
        where: {
          favorites: {
            id: profileId,
          },
        },
        columns: {
          id: true,
          name: true,
        },
        with: {
          user: {
            columns: {
              username: true,
              avatar: true,
            },
          },
        },
      })
    );

    return followers
      .filter((f) => f.user)
      .map((f) => ({
        id: f.id,
        username: f.user!.username,
        avatar: imageUrl(f.user!.avatar, "avatar"),
        name: f.name,
      }));
  }
}
