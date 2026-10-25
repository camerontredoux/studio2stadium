import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { eventEndsAt, orgDefaultTimezone } from "#utils/event-time";
import { inject } from "@adonisjs/core";
import { and, asc, eq } from "drizzle-orm";

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
          // The next event to make active is the earliest one that hasn't
          // ended yet, judged by its own end in its own zone.
          const [org] = await tx
            .select({ settings: organizations.settings })
            .from(organizations)
            .where(eq(organizations.id, orgId));
          const orgDefault = orgDefaultTimezone(org?.settings);
          const candidates = await tx
            .select({
              id: orgEvents.id,
              startDate: orgEvents.startDate,
              endDate: orgEvents.endDate,
              startTime: orgEvents.startTime,
              endTime: orgEvents.endTime,
              timezone: orgEvents.timezone,
            })
            .from(orgEvents)
            .where(eq(orgEvents.orgId, orgId))
            .orderBy(asc(orgEvents.startDate));
          const now = Date.now();
          const next = candidates.find(
            (event) => eventEndsAt(event, orgDefault).getTime() > now
          );

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
