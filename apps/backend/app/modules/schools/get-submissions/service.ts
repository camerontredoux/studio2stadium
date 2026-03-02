import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const submissions = await this.db.use((db) =>
      db.query.crvSubmissions.findMany({
        where: { schoolId: profileId },
        columns: {
          id: true,
          status: true,
          watched: true,
          watchedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        with: {
          dancer: {
            columns: {
              id: true,
              gradYear: true,
              location: true,
            },
            with: {
              user: {
                columns: {
                  avatar: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
              submission: {
                columns: {
                  youtubeId: true,
                },
              },
            },
          },
        },
      })
    );

    return submissions.flatMap((s) => {
      if (!s.dancer?.user) return [];

      return [
        {
          id: s.id,
          status: s.status,
          watched: s.watched,
          watchedAt: s.watchedAt,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          dancer: {
            id: s.dancer.id,
            username: s.dancer.user.username,
            avatar: imageUrl(s.dancer.user.avatar, "avatar"),
            name: `${s.dancer.user.firstName} ${s.dancer.user.lastName}`,
            gradYear: s.dancer.gradYear,
            location: s.dancer.location,
          },
          youtubeId: s.dancer.submission?.youtubeId ?? null,
        },
      ];
    });
  }
}
