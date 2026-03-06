import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const dancers = await this.db.use((db) =>
      db.query.dancerProfiles.findMany({
        columns: {
          id: true,
          location: true,
          gpa: true,
          gradYear: true,
          createdAt: true,
        },
        with: {
          user: {
            columns: {
              id: true,
              username: true,
              email: true,
              displayEmail: true,
              firstName: true,
              lastName: true,
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

    return dancers
      .filter((dancer) => dancer.user)
      .map((dancer) => ({
        id: dancer.id,
        location: dancer.location,
        gpa: dancer.gpa,
        gradYear: dancer.gradYear,
        createdAt: dancer.createdAt,
        user: {
          id: dancer.user!.id,
          username: dancer.user!.username,
          email: dancer.user!.displayEmail,
          name: `${dancer.user!.firstName} ${dancer.user!.lastName}`,
          avatar: imageUrl(dancer.user!.avatar, "avatar"),
          verified: dancer.user!.verified,
          role: dancer.user!.role,
        },
      }));
  }
}
