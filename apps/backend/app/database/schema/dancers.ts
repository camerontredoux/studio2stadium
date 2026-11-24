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
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    birthday: pg.date({ mode: "string" }).notNull(),
    location: pg.text().notNull(),
    biography: pg.text(),
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

// A "Spotlight" a dancer sends to a program: a time window during which the
// dancer is featured in that program's Dancer Spotlight section. Each send is
// its own immutable record (createdAt is the submission time, featuredUntil is
// the 7-day expiry) so that expired spotlights are preserved as history and a
// dancer can hold several across different programs at once. A dancer may send
// to the same program only once per 30-day cooldown (createdAt + 30 days),
// enforced in create-spotlight/service.ts — so there is deliberately no unique
// (dancer, school) constraint here.
export const featuredPlacements = pg.pgTable(
  "featured_placements",
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
    featuredUntil: pg.timestamp({ withTimezone: true }).notNull(),
    paid: pg.boolean().notNull().default(true),
    ...timestamps,
  },
  (table) => [
    // The school-facing lookup filters by school and an active window.
    pg.index().on(table.schoolId, table.featuredUntil),
    // The dancer-facing lookup lists a dancer's sends newest-first and backs the
    // cooldown check (latest send per program).
    pg.index().on(table.dancerId, table.schoolId, table.createdAt),
  ]
);
