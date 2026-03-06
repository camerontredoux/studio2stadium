import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const applications = await this.db.use((db) =>
      db.query.schoolApplications.findMany({
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
                  id: true,
                  email: true,
                  displayEmail: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  verified: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    );

    return applications
      .filter((app) => app.school && app.school.user)
      .map((app) => ({
        id: app.id,
        status: app.status,
        notes: app.notes,
        thumbnail: imageUrl(app.mediaId, "thumbnail"),
        createdAt: app.createdAt,
        school: {
          id: app.school!.id,
          name: app.school!.name,
          location: app.school!.location,
          user: {
            ...app.school!.user!,
            avatar: imageUrl(app.school!.user!.avatar, "avatar"),
          },
        },
      }));
  }
}
