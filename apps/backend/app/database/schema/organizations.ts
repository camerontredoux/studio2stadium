import { sql } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";
import { orgMemberType, orgRole, premiumGrantSource } from "./enums.ts";
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
    // An Organizer runs the Org's events; a Coach recruits at them. The two are
    // orthogonal, so the same person may hold both memberships (ADR 0003).
    // Coach and dancer stay mutually exclusive, exactly as before organizer
    // existed — the original index is kept, narrowed to those two rows.
    // Left unnamed to keep the original auto-generated index name.
    //
    // The predicates name the participant types rather than excluding
    // `organizer` so the DDL never mentions a label added in the same
    // migration, which Postgres rejects. It also fails safe: a member type
    // added later is excluded from this index until someone decides otherwise.
    pg
      .uniqueIndex()
      .on(table.userId, table.orgId)
      .where(sql`type in ('coach', 'dancer')`),
    pg
      .uniqueIndex("org_memberships_one_organizer_per_org")
      .on(table.userId, table.orgId)
      .where(sql`type not in ('coach', 'dancer')`),
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

export const dancerInvites = pg.pgTable(
  "org_dancer_invites",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    orgId: pg
      .uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: pg.text().notNull(),
    token: pg.varchar({ length: 64 }).notNull().unique(),
    expiresAt: pg.timestamp({ withTimezone: true }).notNull(),
    consumedAt: pg.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.orgId, table.email),
    pg.index().on(table.token),
  ]
);
