import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters } from "#database/schema/org-events";
import { and, eq, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class StatsRosterService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, q: Validator) {
    const [row] = await this.db.use((db) =>
      db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where ${eventRosters.userId} is not null)::int`,
          pending: sql<number>`count(*) filter (where ${eventRosters.userId} is null)::int`,
        })
        .from(eventRosters)
        .where(
          and(eq(eventRosters.eventId, eventId), eq(eventRosters.type, q.type))
        )
    );
    return {
      total: row?.total ?? 0,
      active: row?.active ?? 0,
      pending: row?.pending ?? 0,
    };
  }
}
