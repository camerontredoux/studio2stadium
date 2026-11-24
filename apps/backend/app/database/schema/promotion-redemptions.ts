import * as pg from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/columns.ts";
import { users } from "./users.ts";

/**
 * Stripe promotion codes an account has redeemed at Dancer checkout, for the
 * codes limited to one use per account (`ONCE_PER_ACCOUNT_CODES`). Written by
 * checkout fulfilment, once per account and code, and read when a checkout is
 * created so the code cannot be entered again after a cancel and resubscribe.
 */
export const promotionCodeRedemptions = pg.pgTable(
  "promotion_code_redemptions",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // The customer-facing code, upper-cased (Stripe matches codes without
    // regard to case).
    code: pg.text().notNull(),
    promotionCodeId: pg.text().notNull(),
    checkoutSessionId: pg.text().notNull(),
    ...timestamps,
  },
  (table) => [pg.uniqueIndex().on(table.userId, table.code)]
);
