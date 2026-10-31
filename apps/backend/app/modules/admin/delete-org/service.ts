import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { DatabaseService, type Transaction } from "#database/service";
import { E_DATABASE_ERROR } from "#exceptions/database";
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
    try {
      return await this.db.tx(async (tx) => {
        if (await hasPurchases(tx, params.id)) {
          throw new PurchasedOrgDeleteError();
        }

        const [deleted] = await tx
          .delete(organizations)
          .where(eq(organizations.id, params.id))
          .returning({ id: organizations.id });

        return !!deleted;
      });
    } catch (error) {
      // A purchase committed between the check and the delete: the RESTRICT
      // foreign key on the sale stops the delete. Report it as the same refusal
      // rather than a raw database error.
      if (
        error instanceof E_DATABASE_ERROR &&
        error.code === "E_FK_VIOLATION" &&
        (await this.db.tx((tx) => hasPurchases(tx, params.id)))
      ) {
        throw new PurchasedOrgDeleteError();
      }
      throw error;
    }
  }
}

async function hasPurchases(tx: Transaction, orgId: string) {
  const [purchase] = await tx
    .select({ id: eventTierPurchases.id })
    .from(eventTierPurchases)
    .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
    .where(eq(orgEvents.orgId, orgId))
    .limit(1);
  return !!purchase;
}
