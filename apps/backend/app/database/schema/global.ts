import * as pg from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/columns.ts";

export const posts = pg.pgTable(
  "posts",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    slug: pg.text().notNull().unique(),
    title: pg.text().notNull(),
    content: pg.text().notNull(),
    summary: pg.text().notNull(),
    description: pg.text().notNull(),
    thumbnail: pg.text().notNull(),
    tags: pg.text().array(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.slug), pg.index().using("gin", table.tags)]
);

export const library = pg.pgTable(
  "library",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    youtubeId: pg.text().notNull().unique(),
    category: pg.text().notNull(),
    title: pg.text().notNull(),
    description: pg.text().notNull(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.createdAt), pg.index().on(table.category)]
);
