import { danceEvents } from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { DeleteEventSchema } from "./schema.ts";

@inject()
export class DeleteEventService {
  constructor(private db: DatabaseService) {}

  async execute({ params }: DeleteEventSchema) {
    await this.db.use((db) =>
      db.delete(danceEvents).where(eq(danceEvents.id, params.id))
    );
  }
}
