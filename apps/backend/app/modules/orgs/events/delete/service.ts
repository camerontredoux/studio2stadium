import { DatabaseService } from "#database/service";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { eventEndsAt, orgDefaultTimezone } from "#utils/event-time";
import { inject } from "@adonisjs/core";
import { and, asc, eq } from "drizzle-orm";

/**
 * Someone tried to delete an Org Event that was bought. The sale must outlive
 * it — what was bought does not stop having been bought (ADR 0005) — and the
 * database restricts deleting an event its purchase row points at, so the
 * event is deactivated instead.
 */
export class PurchasedEventDeleteError extends Error {
  constructor() {
    super(
      "This event was purchased and can't be deleted. Deactivate it instead."
    );
  }
}

@inject()
export class DeleteEventService {
  constructor(private db: DatabaseService) {}

  async execute(orgId: string, eventId: string) {
    return this.db.use(async (db) => {
      return db.transaction(async (tx) => {
        const [purchase] = await tx
          .select({ id: eventTierPurchases.id })
          .from(eventTierPurchases)
          .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
          .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)))
          .limit(1);
        if (purchase) throw new PurchasedEventDeleteError();

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
