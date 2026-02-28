import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const submissions = await this.db.use((db) =>
      db.query.crvSubmissions.findMany({
        where: { dancerId: profileId },
        columns: {
          id: true,
          status: true,
          watched: true,
          watchedAt: true,
          updatedAt: true,
        },
        with: {
          school: {
            columns: {
              id: true,
              name: true,
              location: true,
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

    const flattenedSubmissions = submissions.flatMap((submission) => {
      if (!submission.school) return [];

      const { user, ...school } = submission.school;

      if (!user) return [];

      return [
        {
          ...submission,
          school: {
            ...school,
            ...user,
            avatar: imageUrl(user.avatar, {
              fit: "cover",
              width: 320,
              height: 320,
            }),
          },
        },
      ];
    });

    return flattenedSubmissions;
  }
}
