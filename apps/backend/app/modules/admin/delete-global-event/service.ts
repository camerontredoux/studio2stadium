import { globalDanceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator) {
    const existing = await this.db.use((db) =>
      db.query.globalDanceEvents.findFirst({
        where: { id: params.id },
        columns: { id: true },
      })
    );

    if (!existing) {
      return { error: "Event not found" };
    }

    // Attendees reference global_dance_events with onDelete cascade, so the
    // row delete cleans them up.
    await this.db.use((db) =>
      db.delete(globalDanceEvents).where(eq(globalDanceEvents.id, params.id))
    );

    return { id: params.id };
  }
}
