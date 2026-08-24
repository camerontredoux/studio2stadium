import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { orgEvents } from "#database/schema/org-events";
import { orgMemberships, organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { DatabaseService, type Transaction } from "#database/service";
import { E_DATABASE_ERROR } from "#exceptions/database";
import { E_NOT_FOUND } from "#exceptions/not-found";
import { inject } from "@adonisjs/core";
import { and, asc, eq, inArray } from "drizzle-orm";
import { type CheckoutMetadata } from "../checkout/metadata.ts";
import { orgSlugCandidates } from "./slug.ts";

/**
 * A purchase that has been paid for, as the completed Checkout Session
 * describes it. No Stripe types here on purpose: the webhook (issue #90) owns
 * reading the session, and provisioning owns what a purchase turns into, so the
 * part worth testing can be tested without faking a payment provider.
 */
export interface ProvisionInput {
  /**
   * The purchase's identity at the payment provider — the completed Checkout
   * Session id. Provisioning is idempotent on this and nothing else, because a
   * redelivered webhook is the same purchase and a second purchase of the same
   * event by the same buyer is not.
   */
  reference: string;
  /**
   * The buyer, from `client_reference_id`. A user id and never an email: a
   * corporate card carries the finance department's address, and matching on it
   * provisions Orgs the buyer cannot log into (ADR 0004).
   */
  buyerUserId: string;
  /** What was bought, as the buyer described it before paying. */
  purchase: CheckoutMetadata;
}

export interface ProvisionResult {
  purchase: typeof eventTierPurchases.$inferSelect;
  org: typeof organizations.$inferSelect;
  event: typeof orgEvents.$inferSelect;
  /**
   * False when this reference had already been provisioned, in which case
   * nothing was written and the rows returned are the ones the first delivery
   * created.
   */
  provisioned: boolean;
}

const isUniqueViolation = (error: unknown) =>
  error instanceof E_DATABASE_ERROR && error.code === "E_UNIQUE_VIOLATION";

@inject()
export class ProvisionPurchaseService {
  constructor(private db: DatabaseService) {}

  /**
   * Turn a completed purchase into a working customer: an Org, its Org Event at
   * the Event Tier that was bought, the buyer's organizer admin membership, and
   * the record of the sale.
   *
   * All of it or none of it. A half-provisioned customer — an Org with no event,
   * or an event nobody can administer — is worse than a failed purchase, so this
   * is one transaction and a failure part-way leaves nothing behind.
   */
  async execute(input: ProvisionInput): Promise<ProvisionResult> {
    try {
      return await this.provision(input);
    } catch (error) {
      // Two provisions racing — a redelivered webhook arriving while the first
      // is still open, or another Org claiming the slug we picked between our
      // read and our insert. Both are lost races rather than bad input, and the
      // whole attempt has already rolled back, so the retry starts clean: it
      // finds the purchase already recorded, or draws another slug.
      if (!isUniqueViolation(error)) throw error;

      return await this.provision(input);
    }
  }

  /** The recorded sale for a purchase reference, if it has been provisioned. */
  async find(reference: string) {
    return await this.db.use(async (db) => {
      const [row] = await db
        .select()
        .from(eventTierPurchases)
        .where(eq(eventTierPurchases.reference, reference))
        .limit(1);

      return row ?? null;
    });
  }

  private async provision(input: ProvisionInput): Promise<ProvisionResult> {
    return await this.db.tx(async (tx) => {
      const already = await this.findProvisioned(tx, input.reference);
      if (already) return already;

      const [buyer] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, input.buyerUserId))
        .limit(1);

      if (!buyer) {
        throw new E_NOT_FOUND("No account exists for that user");
      }

      const { org, isNew } = await this.resolveOrg(
        tx,
        buyer.id,
        input.purchase.orgName
      );

      const event = await this.createEvent(tx, org.id, isNew, input.purchase);

      // The buyer administers the Org they bought for. `organizer`, never
      // `coach`: an Organizer runs the event rather than recruiting at it (ADR
      // 0003). A buyer whose second purchase lands on an Org they already
      // administer keeps the membership they have.
      await tx
        .insert(orgMemberships)
        .values({
          orgId: org.id,
          userId: buyer.id,
          role: "admin",
          type: "organizer",
        })
        .onConflictDoNothing();

      const [purchase] = await tx
        .insert(eventTierPurchases)
        .values({
          reference: input.reference,
          buyerId: buyer.id,
          eventId: event.id,
          eventTier: input.purchase.eventTier,
        })
        .returning();

      return { purchase: purchase!, org, event, provisioned: true };
    });
  }

  private async findProvisioned(
    tx: Transaction,
    reference: string
  ): Promise<ProvisionResult | null> {
    const [row] = await tx
      .select({
        purchase: eventTierPurchases,
        org: organizations,
        event: orgEvents,
      })
      .from(eventTierPurchases)
      .innerJoin(orgEvents, eq(orgEvents.id, eventTierPurchases.eventId))
      .innerJoin(organizations, eq(organizations.id, orgEvents.orgId))
      .where(eq(eventTierPurchases.reference, reference))
      .limit(1);

    return row ? { ...row, provisioned: false } : null;
  }

  /**
   * The Org this purchase belongs to.
   *
   * S2S Live is sold per event, not per Org (ADR 0001), so a buyer who already
   * administers an Org is buying another event for it — the Org name they typed
   * is the name of an Org they already have, and creating a second one would
   * split their events across two tenants. The Org they administer wins over the
   * name they typed, and the first one they were given wins if they administer
   * several.
   */
  private async resolveOrg(tx: Transaction, buyerId: string, orgName: string) {
    const [existing] = await tx
      .select({ org: organizations })
      .from(orgMemberships)
      .innerJoin(organizations, eq(organizations.id, orgMemberships.orgId))
      .where(
        and(
          eq(orgMemberships.userId, buyerId),
          eq(orgMemberships.type, "organizer"),
          eq(orgMemberships.role, "admin")
        )
      )
      .orderBy(asc(orgMemberships.createdAt))
      .limit(1);

    if (existing) return { org: existing.org, isNew: false };

    const [org] = await tx
      .insert(organizations)
      .values({ name: orgName, slug: await this.freeSlug(tx, orgName) })
      .returning();

    return { org: org!, isNew: true };
  }

  /** The best slug for this Org name that nothing else has taken. */
  private async freeSlug(tx: Transaction, orgName: string) {
    const candidates = orgSlugCandidates(orgName);

    const taken = await tx
      .select({ slug: organizations.slug })
      .from(organizations)
      .where(inArray(organizations.slug, candidates));

    const used = new Set(taken.map((row) => row.slug));
    const free = candidates.find((candidate) => !used.has(candidate));

    // Every numbered variant and the random one taken at once. Raised as a
    // unique violation deliberately: `execute` retries those once, and the
    // retry draws a new random candidate rather than the same losing set.
    if (!free) {
      throw new E_DATABASE_ERROR(`No slug available for "${orgName}"`, {
        code: "E_UNIQUE_VIOLATION",
        cause: "organizations_slug_unique",
      });
    }

    return free;
  }

  private async hasActiveEvent(tx: Transaction, orgId: string) {
    const [active] = await tx
      .select({ id: orgEvents.id })
      .from(orgEvents)
      .where(and(eq(orgEvents.orgId, orgId), eq(orgEvents.isActive, true)))
      .limit(1);

    return Boolean(active);
  }

  /**
   * The Org Event that was bought, stamped with the Event Tier it was bought at
   * — that is where entitlement lives (ADR 0002), so the sold name and the
   * enforced one are set together.
   *
   * It becomes the Org's active event only when nothing else is active. An Org
   * has one active event at a time, and a purchase made while a previous event
   * is still running must not take that event off the floor; the Organizer
   * switches over when they are ready.
   *
   * No Roster Entry is created for the buyer. `CreateEventService` seeds a staff
   * roster row for the admin who creates an event through the product, which is
   * a preview sandbox for someone who will be using the event's coach views. A
   * purchase is not that: the buyer is an Organizer, and an Organizer never
   * appears on a roster (ADR 0003).
   */
  private async createEvent(
    tx: Transaction,
    orgId: string,
    isNewOrg: boolean,
    purchase: CheckoutMetadata
  ) {
    const isActive = isNewOrg || !(await this.hasActiveEvent(tx, orgId));

    const [event] = await tx
      .insert(orgEvents)
      .values({
        orgId,
        name: purchase.eventName,
        startDate: purchase.startDate,
        endDate: purchase.endDate,
        eventTier: purchase.eventTier,
        isActive,
      })
      .returning();

    return event!;
  }
}
