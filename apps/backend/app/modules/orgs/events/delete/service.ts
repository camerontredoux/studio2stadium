import { DatabaseService } from "#database/service";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { inject } from "@adonisjs/core";
import { and, asc, eq, gte } from "drizzle-orm";

/**
 * Someone tried to delete an Org Event that was bought. The sale must outlive
 * it — what was bought does not stop having been bought (ADR 0005) — and the
 * purchase row cascades with the event, so the event is deactivated instead.
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
          const today = new Date().toISOString().slice(0, 10);
          const [next] = await tx
            .select({ id: orgEvents.id })
            .from(orgEvents)
            .where(
              and(eq(orgEvents.orgId, orgId), gte(orgEvents.endDate, today))
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
