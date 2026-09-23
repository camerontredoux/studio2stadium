// apps/backend/app/database/schema/event-tier-purchases.ts
import * as pg from "drizzle-orm/pg-core";
import { eventTier, purchaseDeactivationReason } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { orgEvents } from "./org-events.ts";
import { users } from "./users.ts";

/**
 * One completed purchase of one Org Event, at the Event Tier that was bought.
 *
 * Nothing here recurs (ADR 0001), so this is a sale, not a subscription: the row
 * is written once when a purchase is provisioned. A refund or dispute
 * deactivates the Org Event it paid for (ADR 0005) and is stamped onto this
 * record — once, and never undone here — while the record itself stands,
 * because what was bought does not stop having been bought.
 *
 * `reference` is the purchase's identity at the payment provider — the completed
 * Checkout Session. It is unique because that is what makes provisioning
 * idempotent: webhooks get redelivered, and the second delivery must find this
 * row rather than build a second Org Event.
 */
export const eventTierPurchases = pg.pgTable(
  "event_tier_purchases",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    reference: pg.text().notNull().unique(),
    // Who bought, by user id and never by billing email (ADR 0004). `restrict`
    // rather than `cascade`: a sale outlives the account that made it, and
    // deleting the buyer should be refused rather than quietly erase the record.
    buyerId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    // What was bought. One purchase buys exactly one Org Event, so the event is
    // both the subject of the sale and the place its entitlement lives (ADR
    // 0002) — the Org is reached through it rather than copied alongside it.
    // `restrict` for the same reason as the buyer: deleting the event — or the
    // Org, which cascades to its events — is refused rather than quietly
    // erasing the sale. A bought event is deactivated instead (ADR 0005).
    eventId: pg
      .uuid()
      .notNull()
      .unique()
      .references(() => orgEvents.id, { onDelete: "restrict" }),
    // The Event Tier as sold. `org_events.eventTier` is the live entitlement and
    // may be changed by support; this stays what the buyer actually paid for.
    eventTier: eventTier().notNull(),
    // The payment the purchase was settled with — the Checkout Session's
    // PaymentIntent. Refunds and disputes arrive naming the payment, not the
    // session, so this is how one finds the purchase it undoes. Nullable only
    // because Stripe may omit it on a session; a paid card session carries one.
    paymentIntentId: pg.text().unique(),
    // What the buyer paid, as the completed Checkout Session totalled it, in
    // the currency's minor unit (cents). Recorded rather than looked up from
    // today's price so a billing question gets the amount actually charged,
    // after any discount, without a trip to Stripe (#92). Nullable only because
    // Stripe types the session total as nullable.
    amountTotal: pg.integer(),
    currency: pg.text(),
    // Set once, when a refund or dispute stood the Org Event down (ADR 0005).
    // `deactivatedAt` is what makes that idempotent: a redelivered refund, or
    // a dispute after a refund, finds it set and changes nothing.
    deactivatedAt: pg.timestamp({ withTimezone: true }),
    deactivationReason: purchaseDeactivationReason(),
    // The provider's id for what caused it — the refunded charge or the
    // dispute — so staff can find it in Stripe.
    deactivationReference: pg.text(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.buyerId)]
);
