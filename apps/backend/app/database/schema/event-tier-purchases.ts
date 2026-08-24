// apps/backend/app/database/schema/event-tier-purchases.ts
import * as pg from "drizzle-orm/pg-core";
import { eventTier } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { orgEvents } from "./org-events.ts";
import { users } from "./users.ts";

/**
 * One completed purchase of one Org Event, at the Event Tier that was bought.
 *
 * Nothing here recurs (ADR 0001), so this is a sale, not a subscription: the row
 * is written once when a purchase is provisioned and is never advanced through a
 * lifecycle. A refund deactivates the Org Event it paid for (ADR 0005) and
 * leaves this record standing, because what was bought does not stop having been
 * bought.
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
    eventId: pg
      .uuid()
      .notNull()
      .unique()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    // The Event Tier as sold. `org_events.eventTier` is the live entitlement and
    // may be changed by support; this stays what the buyer actually paid for.
    eventTier: eventTier().notNull(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.buyerId)]
);
