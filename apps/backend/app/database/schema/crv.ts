import * as pg from "drizzle-orm/pg-core";
import { dancerProfiles } from "./dancers.ts";
import { prospectStatus } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { schoolProfiles } from "./schools.ts";

export const crvSubmissions = pg.pgTable(
  "crv_submissions",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    dancerId: pg
      .uuid()
      .notNull()
      .references(() => dancerProfiles.id, { onDelete: "cascade" }),
    schoolId: pg
      .uuid()
      .notNull()
      .references(() => schoolProfiles.id, { onDelete: "cascade" }),
    status: prospectStatus().notNull().default("pending"),
    watched: pg.boolean().notNull().default(false),
    watchedAt: pg.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.dancerId, table.schoolId),
    pg.index().on(table.schoolId),
  ]
);

export const crvVideos = pg.pgTable(
  "crv_videos",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    dancerId: pg
      .uuid()
      .notNull()
      .unique()
      .references(() => dancerProfiles.id, { onDelete: "cascade" }),
    youtubeId: pg.text().notNull(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.dancerId), pg.index().on(table.youtubeId)]
);
