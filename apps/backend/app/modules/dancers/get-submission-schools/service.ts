import { crvSubmissions } from "#database/schema/crv";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq, notInArray } from "drizzle-orm";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(profileId: string) {
    const data = await this.db.use((db) =>
      db
        .select({
          id: schoolProfiles.id,
          name: schoolProfiles.name,
          location: schoolProfiles.location,
          username: users.username,
          avatar: users.avatar,
        })
        .from(schoolProfiles)
        .where(
          notInArray(
            schoolProfiles.id,
            db
              .select({ id: crvSubmissions.schoolId })
              .from(crvSubmissions)
              .where(eq(crvSubmissions.dancerId, profileId))
          )
        )
        .leftJoin(users, eq(schoolProfiles.userId, users.id))
    );

    return data.flatMap((school) => {
      if (!school.username) return [];

      return [
        {
          ...school,
          username: school.username,
          avatar: school.avatar,
        },
      ];
    });
  }
}
