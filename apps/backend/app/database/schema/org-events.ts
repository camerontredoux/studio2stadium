// apps/backend/app/database/schema/org-events.ts
import { sql } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";
import { auditAction, auditResource, orgMemberType } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { organizations } from "./organizations.ts";
import { users } from "./users.ts";

export const orgEvents = pg.pgTable(
  "org_events",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    orgId: pg
      .uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: pg.varchar({ length: 160 }).notNull(),
    startDate: pg.date().notNull(),
    endDate: pg.date().notNull(),
    venueName: pg.text(),
    venueAddress: pg.text(),
    contactEmail: pg.text(),
    isActive: pg.boolean().notNull().default(false),
    schedulePdfUrl: pg.text(),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.orgId),
    pg
      .uniqueIndex("org_events_one_active_per_org")
      .on(table.orgId)
      .where(sql`is_active = true`),
  ]
);

export const eventRosters = pg.pgTable(
  "event_rosters",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    userId: pg.uuid().references(() => users.id, { onDelete: "set null" }),
    type: orgMemberType().notNull(),
    bibNumber: pg.integer(),
    email: pg.text().notNull(),
    firstName: pg.text().notNull(),
    lastName: pg.text().notNull(),
    organization: pg.text(),
    expirationDate: pg.date(),
    csvUploadId: pg.uuid(),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.eventId, table.email),
    pg
      .uniqueIndex("event_rosters_bib_per_event")
      .on(table.eventId, table.bibNumber)
      .where(sql`bib_number IS NOT NULL`),
    pg.index().on(table.eventId, table.type),
    pg.index().on(table.userId),
  ]
);

export const eventDancerProfiles = pg.pgTable("event_dancer_profiles", {
  id: pg.uuid().primaryKey().defaultRandom(),
  rosterId: pg
    .uuid()
    .notNull()
    .unique()
    .references(() => eventRosters.id, { onDelete: "cascade" }),
  profilePhotoUrl: pg.text(),
  gradYear: pg.integer(),
  gpa: pg.doublePrecision(),
  studio: pg.text(),
  state: pg.text(),
  height: pg.text(),
  danceStyles: pg.text().array(),
  bio: pg.text(),
  extra: pg.jsonb(),
  ...timestamps,
});

export const csvUploads = pg.pgTable(
  "csv_uploads",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    type: orgMemberType().notNull(),
    fileUrl: pg.text().notNull(),
    uploadedBy: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    rowsAdded: pg.integer().notNull().default(0),
    rowsUpdated: pg.integer().notNull().default(0),
    rowsErrored: pg.integer().notNull().default(0),
    errorDetails: pg.jsonb(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.eventId, table.createdAt)]
);

export const eventVideoCategories = pg.pgTable(
  "event_video_categories",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    name: pg.varchar({ length: 160 }).notNull(),
    sortOrder: pg.integer().notNull().default(0),
    createdAt: pg.timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pg.index().on(table.eventId),
    pg.uniqueIndex().on(table.eventId, table.name),
  ]
);

export const eventVideos = pg.pgTable(
  "event_videos",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    categoryId: pg
      .uuid()
      .notNull()
      .references(() => eventVideoCategories.id, { onDelete: "restrict" }),
    title: pg.varchar({ length: 300 }).notNull(),
    youtubeId: pg.varchar({ length: 20 }).notNull(),
    sortOrder: pg.integer().notNull().default(0),
    audioKey: pg.varchar({ length: 500 }),
    audioFilename: pg.varchar({ length: 300 }),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.eventId),
    pg.index().on(table.categoryId),
  ]
);

export const eventChecklist = pg.pgTable(
  "event_checklist",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    title: pg.varchar({ length: 160 }).notNull(),
    description: pg.text(),
    completed: pg.boolean().notNull().default(false),
    position: pg.integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [pg.index().on(table.eventId)]
);

export const eventAuditLog = pg.pgTable(
  "event_audit_log",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    actorId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: auditAction().notNull(),
    resource: auditResource().notNull(),
    resourceId: pg.uuid(),
    metadata: pg.jsonb(),
    parentId: pg.uuid().references((): pg.AnyPgColumn => eventAuditLog.id, {
      onDelete: "cascade",
    }),
    createdAt: pg.timestamp().notNull().defaultNow(),
  },
  (table) => [
    pg.index().on(table.eventId, table.createdAt),
    pg.index().on(table.parentId),
    pg.index().on(table.actorId),
  ]
);
