import { sql } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";
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
      .references(() => users.id, { onDelete: "cascade" }),
    birthday: pg.date({ mode: "string" }).notNull(),
    location: pg.text().notNull(),
    biography: pg.text(),
    awards: pg.text(),
    instagram: pg.text(),
    tiktok: pg.text(),
    youtube: pg.text(),
    skillLevel: pg.text(),
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
