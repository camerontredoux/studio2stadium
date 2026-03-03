import { profileViews } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { lt } from "drizzle-orm";
import { ProfileViewedEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(schoolId: string, { params }: Validator) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [result] = await this.db.use((db) =>
      db
        .insert(profileViews)
        .values({
          schoolId: schoolId,
          dancerId: params.id,
        })
        .onConflictDoUpdate({
          target: [profileViews.dancerId, profileViews.schoolId],
          set: {
            updatedAt: new Date(),
          },
          where: lt(profileViews.updatedAt, twentyFourHoursAgo),
        })
        .returning({ id: profileViews.id })
    );

    // Only dispatch if a row was inserted or updated (i.e., 24h passed)
    if (result) {
      ProfileViewedEvent.dispatch({
        dancerId: params.id,
        schoolId,
      });
    }
  }
}
