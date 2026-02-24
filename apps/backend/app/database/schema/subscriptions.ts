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
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.userId),
    pg.index().on(table.currentPeriodEnd),
  ]
);
