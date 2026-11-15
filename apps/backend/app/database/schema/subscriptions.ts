import * as pg from "drizzle-orm/pg-core";
import { subscriptionSource } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { users } from "./users.ts";

export const subscriptions = pg.pgTable(
  "user_subscriptions",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    source: subscriptionSource().notNull(),
    status: pg.text().notNull().default("active"),
    subscriptionId: pg.text().notNull().unique(),
    customerId: pg.text().notNull(),
    priceId: pg.text(),
    cancelAtPeriodEnd: pg.boolean().notNull().default(false),
    currentPeriodEnd: pg.timestamp({ withTimezone: true }),
    canceledAt: pg.timestamp({ withTimezone: true }),
    // When the current run of Premium began (Stripe's subscription
    // start_date). A new checkout after a lapse resets it.
    startedAt: pg.timestamp({ withTimezone: true }),
    // When a renewal payment first failed and Stripe moved the subscription
    // to past_due. Access continues for a grace period from here while
    // Stripe retries the card. Cleared once the subscription leaves past_due.
    pastDueSince: pg.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.userId),
    pg.index().on(table.currentPeriodEnd),
  ]
);

/**
 * One row per 1-Week Pass purchase: a one-time Stripe payment, not a
 * subscription. A pass bought while another is running starts when that one
 * ends, so each purchase adds seven days. The checkout session id makes a
 * redelivered webhook record the purchase once, and the payment intent id
 * finds the pass when its payment is refunded or disputed.
 */
export const weekPasses = pg.pgTable(
  "week_passes",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    checkoutSessionId: pg.text().notNull().unique(),
    paymentIntentId: pg.text(),
    startsAt: pg.timestamp({ withTimezone: true }).notNull(),
    endsAt: pg.timestamp({ withTimezone: true }).notNull(),
    // Set when the payment was fully refunded or disputed. `endsAt` is cut
    // back to that moment (or to `startsAt` for a pass not yet started), so
    // every reader of `endsAt` stops counting the pass.
    revokedAt: pg.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [pg.index().on(table.userId, table.endsAt)]
);

/**
 * A paying member's Premium Recruiting Roadmap. Every timestamp records the
 * first time it happened and is never cleared, so cohorts can be measured
 * even if a dancer later deletes the content that completed a step.
 */
export const premiumRoadmaps = pg.pgTable("premium_roadmaps", {
  userId: pg
    .uuid()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  roadmapVersion: pg.integer().notNull(),
  premiumStartedAt: pg.timestamp({ withTimezone: true }).notNull(),
  firstViewedAt: pg.timestamp({ withTimezone: true }),
  profileCompletedAt: pg.timestamp({ withTimezone: true }),
  videoCompletedAt: pg.timestamp({ withTimezone: true }),
  programViewsCompletedAt: pg.timestamp({ withTimezone: true }),
  trackerCompletedAt: pg.timestamp({ withTimezone: true }),
  favoriteCompletedAt: pg.timestamp({ withTimezone: true }),
  roadmapCompletedAt: pg.timestamp({ withTimezone: true }),
  ...timestamps,
});
