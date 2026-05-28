import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, asc, eq, gte } from "drizzle-orm";

@inject()
export class DeleteEventService {
  constructor(private db: DatabaseService) {}

  async execute(orgId: string, eventId: string) {
    return this.db.use(async (db) => {
      return db.transaction(async (tx) => {
        const [deleted] = await tx
          .delete(orgEvents)
          .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)))
          .returning();

        if (!deleted) return false;

        if (deleted.isActive) {
          const today = new Date().toISOString().slice(0, 10);
          const [next] = await tx
            .select({ id: orgEvents.id })
            .from(orgEvents)
            .where(
              and(
                eq(orgEvents.orgId, orgId),
                gte(orgEvents.endDate, today),
              ),
            )
            .orderBy(asc(orgEvents.startDate))
            .limit(1);

          if (next) {
            await tx
              .update(orgEvents)
              .set({ isActive: true })
              .where(eq(orgEvents.id, next.id));
          }
        }

        return true;
      });
    });
  }
}
