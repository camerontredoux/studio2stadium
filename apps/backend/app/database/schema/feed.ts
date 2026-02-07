import * as pg from "drizzle-orm/pg-core";
import { dancerProfiles } from "./dancers.ts";
import { feedItemType } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { schoolProfiles } from "./schools.ts";

export const dancerFeed = pg.pgTable(
  "dancer_feed",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    contentId: pg.uuid().notNull(),
    contentType: feedItemType().notNull(),
    payload: pg.jsonb(),
    dancerId: pg
      .uuid()
      .notNull()
      .references(() => dancerProfiles.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [pg.index().on(table.dancerId, table.createdAt)]
);

export const schoolFeed = pg.pgTable(
  "school_feed",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    contentId: pg.uuid().notNull(),
    contentType: feedItemType().notNull(),
    payload: pg.jsonb(),
    schoolId: pg
      .uuid()
      .notNull()
      .references(() => schoolProfiles.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [pg.index().on(table.schoolId, table.createdAt)]
);
