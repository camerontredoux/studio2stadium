import { dancerProfiles, featuredPlacements } from "#database/schema/dancers";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";
import { desc, eq } from "drizzle-orm";

type PrioritySpotlight = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  location: string;
  gpa: number | null;
  gradYear: number | null;
  sentAt: string;
  featuredUntil: string;
  active: boolean;
};

/**
 * Paid "Priority Spotlight" placements for the viewing school — dancers who
 * paid to be featured to this program, most recently featured first. Returns
 * both active and expired placements; `active` is true while the window is
 * still open (the feed shows active ones, the page splits them New/History).
 */
@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(
    schoolProfileId: string,
    options: { limit?: number } = {}
  ): Promise<PrioritySpotlight[]> {
    const rows = await this.db.use((db) =>
      db
        .select({
          id: dancerProfiles.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          avatar: users.avatar,
          location: dancerProfiles.location,
          gpa: dancerProfiles.gpa,
          gradYear: dancerProfiles.gradYear,
          sentAt: featuredPlacements.createdAt,
          featuredUntil: featuredPlacements.featuredUntil,
        })
        .from(featuredPlacements)
        .innerJoin(
          dancerProfiles,
          eq(dancerProfiles.id, featuredPlacements.dancerId)
        )
        .innerJoin(users, eq(users.id, dancerProfiles.userId))
        .where(eq(featuredPlacements.schoolId, schoolProfileId))
        .orderBy(desc(featuredPlacements.createdAt))
        .limit(options.limit ?? 50)
    );

    const now = Date.now();
    return rows.map((row) => ({
      id: row.id,
      name: `${row.firstName} ${row.lastName}`,
      username: row.username,
      avatar: imageUrl(row.avatar, "avatar"),
      location: row.location,
      gpa: row.gpa,
      gradYear: row.gradYear,
      sentAt: row.sentAt.toISOString(),
      featuredUntil: row.featuredUntil.toISOString(),
      active: row.featuredUntil.getTime() > now,
    }));
  }
}
