import { follows } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(username: string, userId: string) {
    const school = await this.getSchool(username, userId);

    if (!school) return null;

    const { schoolProfile, ...user } = school;

    if (!schoolProfile) return null;

    const { interested, followers, followersCount, ...profile } = schoolProfile;

    return {
      ...user,
      ...profile,
      followers: followersCount,
      following: followers.length > 0,
      interested: interested.length > 0,
    };
  }

  async getSchool(username: string, userId: string) {
    return await this.db.use((db) =>
      db.query.users.findFirst({
        where: {
          username,
        },
        columns: {
          username: true,
          avatar: true,
        },
        with: {
          images: true,
          videos: true,
          schoolProfile: {
            with: {
              skills: true,
              styles: true,
              events: true,
              sports: true,
              followers: {
                where: {
                  user: {
                    id: userId,
                  },
                },
                columns: {
                  id: true,
                },
              },
              interested: {
                where: {
                  user: {
                    id: userId,
                  },
                },
                columns: {
                  id: true,
                },
              },
            },
            extras: {
              followersCount: (table) =>
                db.$count(follows, eq(follows.schoolId, table.id)),
            },
          },
        },
      })
    );
  }
}
