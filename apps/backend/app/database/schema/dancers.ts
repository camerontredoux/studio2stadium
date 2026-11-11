import { sql } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";
import { biographyFormat } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { schoolProfiles } from "./schools.ts";
import { users } from "./users.ts";

export const dancerProfiles = pg.pgTable(
  "dancer_profiles",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    birthday: pg.date({ mode: "string" }).notNull(),
    location: pg.text().notNull(),
    biography: pg.text(),
    // `plain` biographies were written before formatting existed and render as
    // they always have. Saving from the formatting editor switches to `rich`.
    biographyFormat: biographyFormat().notNull().default("plain"),
    awards: pg.text(),
    instagram: pg.text(),
    tiktok: pg.text(),
    youtube: pg.text(),
    teamLevel: pg.text(),
    highSchool: pg.text(),
    studio: pg.text(),
    gpa: pg.doublePrecision(),
    gradYear: pg.integer(),
    trainingHours: pg.integer(),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.userId),
    pg.index().on(table.gpa),
    pg.index().on(table.location),
  ]
);

export const achievements = pg.pgTable(
  "dancer_achievements",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    profileId: pg
      .uuid()
      .notNull()
      .references(() => dancerProfiles.id, { onDelete: "cascade" }),
    title: pg.text().notNull(),
    description: pg.text().notNull(),
    // Display order the dancer chose. Null until they first reorder, so
    // existing rows keep their creation order.
    position: pg.integer(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.profileId)]
);

export const references = pg.pgTable(
  "dancer_references",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    profileId: pg
      .uuid()
      .notNull()
      .references(() => dancerProfiles.id, { onDelete: "cascade" }),
    name: pg.text().notNull(),
    title: pg.text().notNull(),
    description: pg.text(),
    // Display order the dancer chose. Null until they first reorder, so
    // existing rows keep their creation order.
    position: pg.integer(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.profileId)]
);

export const interests = pg.pgTable(
  "dancer_interests",
  {
    dancerId: pg
      .uuid()
      .notNull()
      .references(() => dancerProfiles.id, { onDelete: "cascade" }),
    schoolId: pg
      .uuid()
      .notNull()
      .references(() => schoolProfiles.id, { onDelete: "cascade" }),
    count: pg.integer().notNull().default(1),
    ...timestamps,
  },
  (table) => [
    pg.primaryKey({ columns: [table.dancerId, table.schoolId] }),
    pg.index().on(table.schoolId),
    pg.check("count <= 3", sql`${table.count} <= 3`),
  ]
);
