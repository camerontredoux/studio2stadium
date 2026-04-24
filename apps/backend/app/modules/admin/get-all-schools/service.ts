import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const schools = await this.db.use((db) =>
      db.query.schoolProfiles.findMany({
        columns: {
          id: true,
          name: true,
          location: true,
          division: true,
          createdAt: true,
        },
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              email: true,
              displayEmail: true,
              avatar: true,
              verified: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    );

    return schools
      .filter(
        (school) =>
          school.user &&
          school.user.verified
      )
      .map((school) => ({
        id: school.id,
        name: school.name,
        location: school.location,
        division: school.division,
        createdAt: school.createdAt,
        user: {
          id: school.user!.id,
          username: school.user!.username,
          email: school.user!.displayEmail,
          avatar: imageUrl(school.user!.avatar, "avatar"),
          verified: school.user!.verified,
          role: school.user!.role,
        },
      }));
  }
}
