import * as pg from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/columns.ts";
import { users } from "./users.ts";

export const videos = pg.pgTable(
  "profile_videos",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mediaId: pg.text().unique().notNull(),
    caption: pg.text(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.userId, table.createdAt)]
);

export const images = pg.pgTable(
  "profile_images",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mediaUrl: pg.text().unique().notNull(),
    caption: pg.text(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.userId, table.createdAt)]
);
