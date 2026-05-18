import { sql } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/columns.ts";
import { orgEvents, eventRosters } from "./org-events.ts";

export const eventFavorites = pg.pgTable(
  "event_favorites",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    coachRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    dancerRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    pg
      .uniqueIndex()
      .on(table.eventId, table.coachRosterId, table.dancerRosterId),
    pg.index().on(table.coachRosterId),
  ]
);

export const eventNotes = pg.pgTable(
  "event_notes",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    coachRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    dancerRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    content: pg.text().notNull(),
    ...timestamps,
  },
  (table) => [
    pg
      .uniqueIndex()
      .on(table.eventId, table.coachRosterId, table.dancerRosterId),
    pg.index().on(table.coachRosterId),
  ]
);

export const eventRatings = pg.pgTable(
  "event_ratings",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    coachRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    dancerRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    rating: pg.smallint().notNull(),
    ...timestamps,
  },
  (table) => [
    pg
      .uniqueIndex()
      .on(table.eventId, table.coachRosterId, table.dancerRosterId),
    pg.index().on(table.coachRosterId),
  ]
);

export const eventSchoolSelections = pg.pgTable(
  "event_school_selections",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    dancerRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    coachRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    createdAt: pg.timestamp().notNull().defaultNow(),
  },
  (table) => [
    pg
      .uniqueIndex()
      .on(table.eventId, table.dancerRosterId, table.coachRosterId),
    pg.index().on(table.eventId, table.dancerRosterId),
    pg.index().on(table.eventId, table.coachRosterId),
  ]
);

export const eventShowcases = pg.pgTable(
  "event_showcases",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    number: pg.integer().notNull(),
    status: pg.text().notNull().default("active"),
    publishedAt: pg.timestamp({ withTimezone: true }),
    createdAt: pg.timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pg
      .uniqueIndex("event_showcases_one_active_per_event")
      .on(table.eventId)
      .where(sql`status = 'active'`),
    pg.index().on(table.eventId),
  ]
);

export const publishedCallbacks = pg.pgTable(
  "published_callbacks",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    showcaseId: pg
      .uuid()
      .notNull()
      .references(() => eventShowcases.id, { onDelete: "cascade" }),
    coachRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    dancerRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    rank: pg.integer().notNull(),
    createdAt: pg.timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pg
      .uniqueIndex()
      .on(table.showcaseId, table.coachRosterId, table.dancerRosterId),
    pg.index().on(table.showcaseId, table.dancerRosterId),
  ]
);

export const eventCallbacks = pg.pgTable(
  "event_callbacks",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    showcaseId: pg
      .uuid()
      .notNull()
      .references(() => eventShowcases.id, { onDelete: "cascade" }),
    coachRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    dancerRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    pg
      .uniqueIndex()
      .on(table.showcaseId, table.coachRosterId, table.dancerRosterId),
    pg.index().on(table.eventId, table.dancerRosterId),
    pg.index().on(table.coachRosterId),
  ]
);
