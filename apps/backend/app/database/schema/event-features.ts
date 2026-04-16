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
