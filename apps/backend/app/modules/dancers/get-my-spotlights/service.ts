import { featuredPlacements } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { imageUrl } from "#utils/image-url";
import { inject } from "@adonisjs/core";
import { desc, eq } from "drizzle-orm";

// A spotlight is Active while its 7-day window is open, otherwise Expired (it
// lives in history). The 30-day cooldown for sending again to this program runs
// from when the spotlight was sent.
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

type MySpotlight = {
  id: string;
  schoolId: string;
  name: string;
  username: string;
  avatar: string | null;
  sentAt: string;
  featuredUntil: string;
  nextEligibleAt: string;
  active: boolean;
};

/**
 * The spotlights the authenticated dancer has sent — each placement featuring
 * them to a program, newest first. Includes both active spotlights and expired
 * history. `active` is true while the 7-day window is still open;
 * `nextEligibleAt` is when the dancer may send to that program again.
 */
@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(dancerProfileId: string): Promise<MySpotlight[]> {
    const rows = await this.db.use((db) =>
      db
        .select({
          id: featuredPlacements.id,
          schoolId: schoolProfiles.id,
          name: schoolProfiles.name,
          username: users.username,
          avatar: users.avatar,
          sentAt: featuredPlacements.createdAt,
          featuredUntil: featuredPlacements.featuredUntil,
        })
        .from(featuredPlacements)
        .innerJoin(
          schoolProfiles,
          eq(schoolProfiles.id, featuredPlacements.schoolId)
        )
        .innerJoin(users, eq(users.id, schoolProfiles.userId))
        .where(eq(featuredPlacements.dancerId, dancerProfileId))
        .orderBy(desc(featuredPlacements.createdAt))
    );

    const now = Date.now();
    return rows.map((row) => ({
      id: row.id,
      schoolId: row.schoolId,
      name: row.name,
      username: row.username,
      avatar: imageUrl(row.avatar, "avatar"),
      sentAt: row.sentAt.toISOString(),
      featuredUntil: row.featuredUntil.toISOString(),
      nextEligibleAt: new Date(
        row.sentAt.getTime() + COOLDOWN_MS
      ).toISOString(),
      active: row.featuredUntil.getTime() > now,
    }));
  }
}
