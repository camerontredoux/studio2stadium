import { danceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import cache from "@adonisjs/cache/services/main";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, ...payload }: Validator) {
    const school = await this.db.use((db) =>
      db.query.users.findFirst({
        where: { username: params.username },
        with: {
          schoolProfile: {
            columns: { id: true },
          },
        },
      })
    );

    const schoolProfile = school?.schoolProfile;
    if (!schoolProfile) {
      return { error: "School not found" };
    }

    const [created] = await this.db.use((db) =>
      db
        .insert(danceEvents)
        .values({
          ...payload,
          startDatetime: new Date(payload.startDatetime),
          endDatetime: new Date(payload.endDatetime),
          schoolId: schoolProfile.id,
        })
        .returning({ id: danceEvents.id })
    );

    await cache.delete({ key: `schools:profile:${params.username}` });

    return { id: created.id };
  }
}
