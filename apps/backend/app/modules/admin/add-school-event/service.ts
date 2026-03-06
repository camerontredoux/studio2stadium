import { danceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, ...payload }: Validator) {
    // Verify the school exists
    const school = await this.db.use((db) =>
      db.query.schoolProfiles.findFirst({
        where: { id: params.schoolId },
      })
    );

    if (!school) {
      return { error: "School not found" };
    }

    const [created] = await this.db.use((db) =>
      db
        .insert(danceEvents)
        .values({
          ...payload,
          startDatetime: new Date(payload.startDatetime),
          endDatetime: new Date(payload.endDatetime),
          schoolId: params.schoolId,
        })
        .returning({ id: danceEvents.id })
    );

    return { id: created.id };
  }
}
