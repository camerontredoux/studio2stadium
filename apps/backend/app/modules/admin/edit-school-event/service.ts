import { danceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, ...payload }: Validator) {
    const existing = await this.db.use((db) =>
      db.query.danceEvents.findFirst({
        where: { id: params.id },
        columns: { id: true },
      })
    );

    if (!existing) {
      return { error: "Event not found" };
    }

    await this.db.use((db) =>
      db
        .update(danceEvents)
        .set({
          ...payload,
          startDatetime: payload.startDatetime
            ? new Date(payload.startDatetime)
            : undefined,
          endDatetime: payload.endDatetime
            ? new Date(payload.endDatetime)
            : undefined,
        })
        .where(eq(danceEvents.id, params.id))
    );

    return { id: params.id };
  }
}
