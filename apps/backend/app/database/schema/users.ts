import * as pg from "drizzle-orm/pg-core";
import { accountType, orgAccountTier, platformName, role } from "./enums.ts";
import { citext, timestamps } from "./helpers/columns.ts";

export const users = pg.pgTable(
  "users",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    username: citext().notNull().unique(),
    email: citext().notNull().unique(),
    role: role().notNull(),
    type: accountType().notNull(),
    displayEmail: pg.text().notNull(),
    firstName: pg.text().notNull(),
    lastName: pg.text().notNull(),
    password: pg.text().notNull(),
    avatar: pg.text(),
    phone: pg.text(),
    verified: pg.boolean().notNull().default(false),
    notifications: pg.boolean().notNull().default(true),
    orgAccountTier: orgAccountTier(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.createdAt)]
);

export const userActivities = pg.pgTable(
  "user_activities",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventType: pg.text().notNull(),
    platformName: platformName(),
    createdAt: timestamps.createdAt,
  },
  (table) => [
    pg.index().on(table.userId, table.createdAt),
    pg.index().on(table.createdAt, table.eventType),
  ]
);

export const platforms = pg.pgTable(
  "user_platforms",
  {
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platformName: platformName().notNull(),
    joinedAt: timestamps.createdAt,
  },
  (table) => [
    pg.primaryKey({ columns: [table.userId, table.platformName] }),
    pg.index().on(table.userId),
    pg.index().on(table.platformName),
  ]
);
