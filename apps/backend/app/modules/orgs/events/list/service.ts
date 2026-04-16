import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { desc, eq } from "drizzle-orm";

@inject()
export class ListEventsService {
  constructor(private db: DatabaseService) {}

  async execute(orgId: string) {
    return this.db.use((db) =>
      db
        .select()
        .from(orgEvents)
        .where(eq(orgEvents.orgId, orgId))
        .orderBy(desc(orgEvents.createdAt))
    );
  }
}
