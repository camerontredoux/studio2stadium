import * as pg from "drizzle-orm/pg-core";
import { dancerProfiles } from "./dancers.ts";
import { platformName } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { organizations } from "./organizations.ts";
import { schoolProfiles } from "./schools.ts";

export const favorites = pg.pgTable(
  "school_favorites",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    schoolId: pg
      .uuid()
      .notNull()
      .references(() => schoolProfiles.id, { onDelete: "cascade" }),
    dancerId: pg
      .uuid()
      .notNull()
      .references(() => dancerProfiles.id, { onDelete: "cascade" }),
    platformName: platformName().notNull(),
    sourceOrgId: pg
      .uuid()
      .references(() => organizations.id, { onDelete: "set null" }),
    comment: pg.text(),
    rating: pg.smallint(),
    lastContacted: pg.timestamp({ withTimezone: true }),
    lastNotification: pg.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.schoolId, table.dancerId),
    pg.index().on(table.dancerId),
    pg.index().on(table.schoolId),
  ]
);

export const follows = pg.pgTable(
  "dancer_follows",
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
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.dancerId, table.schoolId),
    pg.index().on(table.schoolId),
    pg.index().on(table.dancerId),
  ]
);

export const profileViews = pg.pgTable(
  "profile_views",
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
    ...timestamps,
  },
  (table) => [pg.uniqueIndex().on(table.dancerId, table.schoolId)]
);
