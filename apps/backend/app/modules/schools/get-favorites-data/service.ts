import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const favorites = await this.db.use((db) =>
      db.query.favorites.findMany({
        where: { schoolId: profileId },
        columns: {
          id: true,
          platformName: true,
          comment: true,
          rating: true,
          lastContacted: true,
          createdAt: true,
        },
        with: {
          dancer: {
            columns: {},
            with: {
              user: {
                columns: {
                  username: true,
                },
              },
            },
          },
        },
      })
    );

    return favorites.flatMap((f) => {
      if (!f.dancer?.user) return [];

      return [
        {
          id: f.id,
          platformName: f.platformName,
          comment: f.comment,
          rating: f.rating,
          lastContacted: f.lastContacted,
          createdAt: f.createdAt,
          username: f.dancer.user.username,
        },
      ];
    });
  }
}
