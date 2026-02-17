import * as pg from "drizzle-orm/pg-core";
import { danceEventType } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { schoolProfiles } from "./schools.ts";
import { users } from "./users.ts";

export const danceEvents = pg.pgTable(
  "dance_events",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    schoolId: pg
      .uuid()
      .notNull()
      .references(() => schoolProfiles.id, { onDelete: "cascade" }),
    title: pg.text().notNull(),
    description: pg.text().notNull(),
    location: pg.text().notNull(),
    address: pg.text(),
    website: pg.text(),
    tags: pg.text().array(),
    cost: pg.numeric(),
    type: danceEventType().notNull(),
    startDatetime: pg.timestamp().notNull(),
    endDatetime: pg.timestamp().notNull(),
    timezone: pg.text().notNull(),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.schoolId),
    pg.index().on(table.startDatetime),
    pg.index().using("gin", table.tags),
  ]
);

export const globalDanceEvents = pg.pgTable(
  "global_dance_events",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    title: pg.text().notNull(),
    thumbnail: pg.text().notNull(),
    description: pg.text().notNull(),
    location: pg.text().notNull(),
    website: pg.text().notNull(),
    organization: pg.text().notNull(),
    startDatetime: pg.timestamp().notNull(),
    endDatetime: pg.timestamp().notNull(),
    type: danceEventType().notNull(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.startDatetime)]
);

export const danceEventSchedules = pg.pgTable(
  "dance_event_schedules",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => danceEvents.id, { onDelete: "cascade" }),
    schedule: pg.jsonb().notNull().$type<
      {
        time: string;
        activity: string;
        description?: string;
      }[]
    >(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.eventId)]
);

export const danceEventAttendees = pg.pgTable(
  "dance_event_attendees",
  {
    eventId: pg
      .uuid()
      .notNull()
      .references(() => danceEvents.id, { onDelete: "cascade" }),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [pg.primaryKey({ columns: [table.userId, table.eventId] })]
);

export const globalDanceEventAttendees = pg.pgTable(
  "global_dance_event_attendees",
  {
    eventId: pg
      .uuid()
      .notNull()
      .references(() => globalDanceEvents.id, { onDelete: "cascade" }),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [pg.primaryKey({ columns: [table.userId, table.eventId] })]
);
