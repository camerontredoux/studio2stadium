import * as pg from "drizzle-orm/pg-core";
import {
  isNotRosterTypeSql,
  isRosterTypeSql,
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
    // An Organizer runs the Org's events; a Coach recruits at them. The two are
    // orthogonal, so the same person may hold both memberships (ADR 0003).
    // Coach and dancer stay mutually exclusive, exactly as before organizer
    // existed — the original index is kept, narrowed to those two rows.
    // Left unnamed to keep the original auto-generated index name.
    pg.uniqueIndex().on(table.userId, table.orgId).where(isRosterTypeSql()),
    // The complement: one organizer membership per person per Org. It caps the
    // person, not the Org — an Org may have several Organizers, each with their
    // own row.
    //
    // This is the one predicate that cannot be phrased positively: `organizer`
    // is added by the same migration, and Postgres refuses DDL naming an enum
    // label added in its own transaction. The cost is that it reads as "not a
    // Roster type" rather than "is an organizer", so a fourth member type added
    // later would silently share this uniqueness slot and could not coexist
    // with an organizer membership. Whoever adds one should split this index —
    // `where type = 'organizer'` is safe in any later migration.
    pg
      .uniqueIndex("org_memberships_organizer_per_user_per_org")
      .on(table.userId, table.orgId)
      .where(isNotRosterTypeSql()),
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
