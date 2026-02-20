import {
  danceEventAttendees,
  globalDanceEventAttendees,
} from "#database/schema/events";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { and, eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params, type }: Validator, userId: string) {
    const table =
      type === "global" ? globalDanceEventAttendees : danceEventAttendees;

    await this.db.use((db) =>
      db
        .delete(table)
        .where(and(eq(table.eventId, params.id), eq(table.userId, userId)))
    );
  }
}
