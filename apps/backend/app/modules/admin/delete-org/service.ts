import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";
import { Validator } from "./validator.ts";

/**
 * Staff tried to delete an Org that has bought an Org Event. Deleting the Org
 * takes its events with it, and a sale must outlive what it paid for (ADR
 * 0005) — so the Org stays. The single-event guard (#112) refuses the same way.
 */
export class PurchasedOrgDeleteError extends Error {
  constructor() {
    super(
      "This organization has purchased events and can't be deleted, so its sale records are kept."
    );
  }
}

@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute({ params }: Validator) {
    return this.db.use((db) =>
      db.transaction(async (tx) => {
        const [purchase] = await tx
          .select({ id: eventTierPurchases.id })
          .from(eventTierPurchases)
          .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
          .where(eq(orgEvents.orgId, params.id))
          .limit(1);
        if (purchase) throw new PurchasedOrgDeleteError();

        const [deleted] = await tx
          .delete(organizations)
          .where(eq(organizations.id, params.id))
          .returning({ id: organizations.id });

        return !!deleted;
      })
    );
  }
}
