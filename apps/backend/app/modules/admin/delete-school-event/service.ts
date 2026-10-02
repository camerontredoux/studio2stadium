import { danceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator) {
    const existing = await this.db.use((db) =>
      db.query.danceEvents.findFirst({
        where: { id: params.id },
        columns: { id: true },
      })
    );

    if (!existing) {
      return { error: "Event not found" };
    }

    // Schedules and attendees reference dance_events with onDelete cascade, so
    // the row delete cleans them up.
    await this.db.use((db) =>
      db.delete(danceEvents).where(eq(danceEvents.id, params.id))
    );

    return { id: params.id };
  }
}
