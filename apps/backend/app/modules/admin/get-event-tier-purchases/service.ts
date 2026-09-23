import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { eventAuditLog, orgEvents } from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { readTierChangeAudit } from "#modules/orgs/events/update/tier-change-audit";
import type { EventTier } from "#shared/org/event-tiers";
import { inject } from "@adonisjs/core";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

/** Who someone is, as a staff member reading a billing record needs it. */
interface Person {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * The most recent hand change to an Org Event's Event Tier: what it moved from
 * and to, who moved it and when. Read from the event's audit log, which is
 * where the tier-change entry is written (`orgs/events/update`).
 */
export interface EventTierChange {
  from: EventTier | null;
  to: EventTier;
  changedAt: Date;
  changedBy: Person;
}

/** A user as `Person`, selected the same way for buyers and tier changers. */
const personColumns = {
  id: users.id,
  email: users.displayEmail,
  firstName: users.firstName,
  lastName: users.lastName,
};

/**
 * Every Event Tier purchase, newest first, as staff answer billing questions
 * from it (#92): who bought, what they paid, at which Event Tier, for which Org
 * Event — and, beside the tier that was sold, the tier the event is at now and
 * who last changed it by hand, since the two can differ.
 */
@inject()
export class Service {
  constructor(private db: DatabaseService) {}

  async execute() {
    const purchases = await this.db.use((db) =>
      db
        .select({
          id: eventTierPurchases.id,
          reference: eventTierPurchases.reference,
          eventTier: eventTierPurchases.eventTier,
          amountTotal: eventTierPurchases.amountTotal,
          currency: eventTierPurchases.currency,
          paymentIntentId: eventTierPurchases.paymentIntentId,
          deactivatedAt: eventTierPurchases.deactivatedAt,
          deactivationReason: eventTierPurchases.deactivationReason,
          deactivationReference: eventTierPurchases.deactivationReference,
          createdAt: eventTierPurchases.createdAt,
          buyer: personColumns,
          event: {
            id: orgEvents.id,
            name: orgEvents.name,
            eventTier: orgEvents.eventTier,
            isActive: orgEvents.isActive,
            startDate: orgEvents.startDate,
            endDate: orgEvents.endDate,
          },
          org: {
            id: organizations.id,
            name: organizations.name,
            slug: organizations.slug,
          },
        })
        .from(eventTierPurchases)
        .innerJoin(users, eq(users.id, eventTierPurchases.buyerId))
        .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
        .innerJoin(organizations, eq(organizations.id, orgEvents.orgId))
        .orderBy(desc(eventTierPurchases.createdAt))
    );

    const changes = await this.latestTierChanges(
      purchases.map((p) => p.event.id)
    );

    return purchases.map((purchase) => ({
      ...purchase,
      lastEventTierChange: changes.get(purchase.event.id) ?? null,
    }));
  }

  /** The newest tier-change audit entry for each of these Org Events. */
  private async latestTierChanges(eventIds: string[]) {
    const latest = new Map<string, EventTierChange>();
    if (eventIds.length === 0) return latest;

    const rows = await this.db.use((db) =>
      db
        .select({
          eventId: eventAuditLog.eventId,
          metadata: eventAuditLog.metadata,
          createdAt: eventAuditLog.createdAt,
          actor: personColumns,
        })
        .from(eventAuditLog)
        .innerJoin(users, eq(users.id, eventAuditLog.actorId))
        .where(
          and(
            inArray(eventAuditLog.eventId, eventIds),
            eq(eventAuditLog.resource, "event"),
            sql`${eventAuditLog.metadata} -> 'diff' -> 'eventTier' is not null`
          )
        )
        .orderBy(desc(eventAuditLog.createdAt))
    );

    for (const row of rows) {
      if (latest.has(row.eventId)) continue;
      const diff = readTierChangeAudit(row.metadata);
      if (!diff) continue;
      latest.set(row.eventId, {
        ...diff,
        changedAt: row.createdAt,
        changedBy: row.actor,
      });
    }

    return latest;
  }
}
