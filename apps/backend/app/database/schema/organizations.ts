import * as pg from "drizzle-orm/pg-core";
import {
  orgMemberType,
  orgRole,
  premiumGrantSource,
} from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { users } from "./users.ts";

export const organizations = pg.pgTable(
  "organizations",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    name: pg.varchar({ length: 128 }).notNull(),
    slug: pg.varchar({ length: 64 }).notNull().unique(),
    logoUrl: pg.text(),
    primaryColor: pg.varchar({ length: 16 }),
    accentColor: pg.varchar({ length: 16 }),
    features: pg.jsonb().notNull().default({}),
    settings: pg.jsonb().notNull().default({}),
    ...timestamps,
  },
  (table) => [pg.index().on(table.slug)]
);

export const orgMemberships = pg.pgTable(
  "org_memberships",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orgId: pg
      .uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: orgRole().notNull().default("member"),
    type: orgMemberType().notNull(),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.userId, table.orgId),
    pg.index().on(table.orgId),
    pg.index().on(table.userId),
  ]
);

export const premiumGrants = pg.pgTable(
  "premium_grants",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceType: premiumGrantSource().notNull(),
    sourceId: pg.uuid(), // org_events.id once that table exists (Plan 3)
    grantedAt: pg.timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: pg.timestamp({ withTimezone: true }).notNull(),
    revokedAt: pg.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.userId, table.expiresAt),
    pg.index().on(table.expiresAt),
  ]
);
