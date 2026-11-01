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
    // Despite the name, `verified` is not about the email address: it is set
    // when a dancer finishes onboarding and when staff accept a school's
    // application. `emailVerifiedAt` is when the account's owner last proved
    // they read its inbox — by using a password link or an Org claim link
    // emailed to it. Provisioning trusts an existing account with a paid Org
    // only once this is set (ADR 0007).
    verified: pg.boolean().notNull().default(false),
    emailVerifiedAt: pg.timestamp({ withTimezone: true }),
    notifications: pg.boolean().notNull().default(true),
    orgAccountTier: orgAccountTier(),
    orgAccountTierExpiresAt: pg.timestamp({ withTimezone: true }),
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
