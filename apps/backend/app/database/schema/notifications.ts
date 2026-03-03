import { isNull } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/columns.ts";
import { users } from "./users.ts";

export const outbox = pg.pgTable(
  "outbox",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    type: pg.text().notNull(),
    payload: pg.jsonb().notNull(),
    publishedAt: pg.timestamp({ withTimezone: true }),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    pg.index().on(table.type),
    pg.index().on(table.publishedAt).where(isNull(table.publishedAt)),
  ]
);

export const notifications = pg.pgTable(
  "notifications",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    content: pg.jsonb().notNull(),
    seenAt: pg.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.userId, table.createdAt),
    pg.index().on(table.createdAt),
    pg.index().on(table.seenAt).where(isNull(table.seenAt)),
  ]
);

export const processedEvents = pg.pgTable("processed_events", {
  eventId: pg.uuid().primaryKey(),
  eventType: pg.text().notNull(),
  processedAt: timestamps.createdAt,
});

export const globalNotifications = pg.pgTable(
  "global_notifications",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    content: pg.jsonb().notNull(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.createdAt)]
);
