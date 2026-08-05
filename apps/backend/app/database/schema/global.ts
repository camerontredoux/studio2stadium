import * as pg from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/columns.ts";

/**
 * A downloadable file (currently PDFs) attached to a blog post.
 *
 * `key` is the private R2 object key and is never exposed to clients — the
 * public download route addresses attachments by `id` and resolves the key
 * server-side. `size`/`contentType`/`uploadedAt` are captured from R2 object
 * metadata at attach time (the source of truth), not from the client.
 */
export interface BlogAttachment {
  id: string;
  name: string;
  key: string;
  size: number;
  contentType: string;
  uploadedAt: string;
}

export const posts = pg.pgTable(
  "posts",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    slug: pg.text().notNull().unique(),
    title: pg.text().notNull(),
    content: pg.text().notNull(),
    description: pg.text().notNull(),
    thumbnail: pg.text().notNull(),
    tags: pg.text().array(),
    attachments: pg.jsonb().$type<BlogAttachment[]>(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.slug), pg.index().using("gin", table.tags)]
);

export const library = pg.pgTable(
  "video_library",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    url: pg.text().notNull().unique(),
    category: pg.text().notNull(),
    title: pg.text().notNull(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.createdAt), pg.index().on(table.category)]
);
