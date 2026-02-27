import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const following = await this.db.use((db) =>
      db.query.follows.findMany({
        where: {
          dancerId: profileId,
        },
        with: {
          school: {
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
          },
        },
      })
    );

    return following
      .sort((a, b) => a.school!.name.localeCompare(b.school!.name))
      .filter((f) => f.school?.user)
      .map((f) => ({
        id: f.school!.id,
        username: f.school!.user!.username,
        avatar: f.school!.user!.avatar?.startsWith("avatar")
          ? imageUrl(f.school!.user!.avatar, {
              fit: "cover",
              width: 100,
              height: 100,
            })
          : f.school!.user!.avatar,
        name: f.school!.name,
      }));
  }
}
