import { crvSubmissions } from "#database/schema/crv";
import { schoolApplications, schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";
import { and, eq, isNull, not, notInArray, or } from "drizzle-orm";

// TODO: make this admin-managed (a per-school "hide from common recruiting"
// toggle) instead of a hardcoded list.
const HIDDEN_SCHOOL_USER_IDS = [
  "04be95ed-ca37-4acc-94cf-c02691798bf8", // University of Tennessee
  "c5f879a1-42b8-4fd1-a38d-76a567cbb6d3", // Studio 2 Stadium
  "cb4d3f31-ec01-4466-8ce9-bb0bc0bc12b6", // SummitTesting
];

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
          and(
            notInArray(
              schoolProfiles.id,
              db
                .select({ id: crvSubmissions.schoolId })
                .from(crvSubmissions)
                .where(eq(crvSubmissions.dancerId, profileId))
            ),
            not(eq(users.role, "admin")),
            eq(users.verified, true),
            notInArray(users.id, HIDDEN_SCHOOL_USER_IDS),
            or(
              isNull(schoolApplications.status),
              eq(schoolApplications.status, "accepted")
            )
          )
        )
        .leftJoin(users, eq(schoolProfiles.userId, users.id))
        .leftJoin(
          schoolApplications,
          eq(schoolApplications.schoolId, schoolProfiles.id)
        )
    );

    return data.flatMap((school) => {
      if (!school.username) return [];

      return [
        {
          ...school,
          username: school.username,
          avatar: imageUrl(school.avatar, "avatar"),
        },
      ];
    });
  }
}
