import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const followers = await this.db.use((db) =>
      db.query.dancerProfiles.findMany({
        where: {
          following: {
            id: profileId,
          },
        },
        columns: {
          id: true,
        },
        with: {
          user: {
            columns: {
              firstName: true,
              lastName: true,
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
        name: `${f.user!.firstName} ${f.user!.lastName}`,
      }));
  }
}
