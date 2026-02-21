import { DatabaseService } from "#database/service";
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
          videoId: true,
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

      const { videoId, ...submissionWithoutVideoId } = submission;

      return [
        {
          ...submissionWithoutVideoId,
          school: {
            ...school,
            ...user,
          },
        },
      ];
    });

    return {
      videoId: submissions[0]?.videoId ?? null,
      submissions: flattenedSubmissions,
    };
  }
}
