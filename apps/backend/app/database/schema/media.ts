import * as pg from "drizzle-orm/pg-core";
import { videoType, videoUploadStatus } from "./enums.ts";
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
    type: videoType().notNull().default("youtube"),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.userId, table.createdAt),
    pg.index().on(table.userId),
  ]
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
  (table) => [
    pg.index().on(table.userId, table.createdAt),
    pg.index().on(table.userId),
  ]
);

export const videoUploads = pg.pgTable(
  "video_uploads",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cloudflareMediaId: pg.text().unique().notNull(),
    status: videoUploadStatus().notNull().default("pending"),
    thumbnailUrl: pg.text(),
    duration: pg.real(),
    errorMessage: pg.text(),
    videoId: pg.uuid().references(() => videos.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.userId),
    pg.index().on(table.cloudflareMediaId),
  ]
);
