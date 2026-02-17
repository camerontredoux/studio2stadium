import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(username: string) {
    const dancer = await this.getDancer(username);

    if (!dancer) return null;

    const { dancerProfile, ...user } = dancer;

    if (!dancerProfile) return null;

    return {
      ...user,
      ...dancerProfile,
    };
  }

  async getDancer(username: string) {
    return await this.db.use((db) =>
      db.query.users.findFirst({
        where: {
          username,
          platforms: {
            platformName: "core",
          },
        },
        columns: {
          username: true,
          avatar: true,
        },
        with: {
          dancerProfile: {
            columns: {
              id: true,
              birthday: true,
              location: true,
              skillLevel: true,
              teamLevel: true,
              highSchool: true,
              studio: true,
              gpa: true,
              gradYear: true,
              trainingHours: true,
            },
            with: {
              skills: true,
              styles: true,
              references: true,
              achievements: true,
            },
          },
        },
      })
    );
  }
}
