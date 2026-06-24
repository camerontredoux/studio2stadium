import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters } from "#database/schema/org-events";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class FiltersRosterService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, q: Validator) {
    const rows = await this.db.use((db) =>
      db
        .selectDistinct({ organization: eventRosters.organization })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, q.type),
            isNotNull(eventRosters.organization),
            eq(eventRosters.isStaff, false)
          )
        )
        .orderBy(asc(eventRosters.organization))
    );
    return {
      organizations: rows
        .map((r) => r.organization)
        .filter((v): v is string => v !== null),
    };
  }
}
