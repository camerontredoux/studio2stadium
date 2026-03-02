import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const following = await this.db.use((db) =>
      db.query.favorites.findMany({
        where: {
          schoolId: profileId,
        },
        with: {
          dancer: {
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
          },
        },
      })
    );

    return following
      .filter((f) => f.dancer?.user)
      .sort((a, b) => {
        const nameA = `${a.dancer!.user!.firstName} ${a.dancer!.user!.lastName}`;
        const nameB = `${b.dancer!.user!.firstName} ${b.dancer!.user!.lastName}`;
        return nameA.localeCompare(nameB);
      })
      .map((f) => ({
        id: f.dancer!.id,
        username: f.dancer!.user!.username,
        avatar: imageUrl(f.dancer!.user!.avatar, "avatar"),
        name: `${f.dancer!.user!.firstName} ${f.dancer!.user!.lastName}`,
      }));
  }
}
