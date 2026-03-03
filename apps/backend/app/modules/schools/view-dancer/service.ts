import { profileViews } from "#database/schema/profiles";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { ProfileViewedEvent } from "./event.ts";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute(schoolId: string, { params }: Validator, isAdmin?: boolean) {
    const [result] = await this.db.use((db) =>
      db
        .insert(profileViews)
        .values({
          school_id: schoolId,
          dancer_id: params.id,
        })
        .onConflictDoNothing()
        .returning({ id: profileViews.id })
    );

    // Only dispatch event for first-time views
    if (result) {
      ProfileViewedEvent.dispatch({
        dancerId: params.id,
        schoolId,
        isAdmin,
      });
    }
  }
}
