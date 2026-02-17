import * as pg from "drizzle-orm/pg-core";
import { feedItemType } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { users } from "./users.ts";

export const feed = pg.pgTable(
  "feed",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    contentId: pg.uuid().notNull(),
    contentType: feedItemType().notNull(),
    payload: pg.jsonb(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.userId, table.createdAt.desc()),
    pg.index().on(table.userId),
    pg.index().on(table.createdAt.desc()),
  ]
);
