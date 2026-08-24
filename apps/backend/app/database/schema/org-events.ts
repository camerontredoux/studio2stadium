// apps/backend/app/database/schema/org-events.ts
import { sql } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";
import {
  auditAction,
  auditResource,
  csvRowOutcome,
  orgMemberType,
  rosterClaimStatus,
  isRosterTypeSql,
  type RosterType,
} from "./enums.ts";
import { citext, timestamps } from "./helpers/columns.ts";
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
    startTime: pg.text(),
    timezone: pg.text(),
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
    // A Roster Entry is a Coach or a Dancer. Organizers run the event rather
    // than taking part in it (ADR 0003), so `organizer` is excluded here at the
    // type level and by the `event_rosters_type_not_organizer` CHECK below.
    type: orgMemberType().$type<RosterType>().notNull(),
    bibNumber: pg.integer(),
    email: pg.text().notNull(),
    firstName: pg.text().notNull(),
    lastName: pg.text().notNull(),
    organization: pg.text(),
    expirationDate: pg.date(),
    csvUploadId: pg.uuid(),
    checkedInAt: pg.timestamp({ withTimezone: true }),
    // Free-tier Users: paid intent from the dancer CSV. When the org's
    // freeTierUsers feature is on, paid=false means "create an account but no
    // premium grant" (the dancer becomes a limited user). Carried from upload
    // through to invite-claim so the grant decision survives until activation.
    paid: pg.boolean().default(false),
    // Staff/preview rosters: a real row owned by an admin "viewing as" a
    // coach/dancer. Anchors scouting/check-in FKs but is excluded from all
    // participant-facing and aggregate queries. Admins are never real
    // participants, so any staff row is by definition a sandbox.
    isStaff: pg.boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    // Real participants are unique by email; staff rows are exempt so one admin
    // can hold both a coach and a dancer sandbox (same email) for the event.
    // Left unnamed to keep the original auto-generated index name.
    pg
      .uniqueIndex()
      .on(table.eventId, table.email)
      .where(sql`is_staff = false`),
    // At most one staff-coach and one staff-dancer per admin per event.
    pg
      .uniqueIndex("event_rosters_staff_per_user")
      .on(table.eventId, table.userId, table.type)
      .where(sql`is_staff = true`),
    pg
      .uniqueIndex("event_rosters_bib_per_event")
      .on(table.eventId, table.bibNumber)
      .where(sql`bib_number IS NOT NULL`),
    pg.index().on(table.eventId, table.type),
    pg.index().on(table.userId),
    // A Roster Entry is a Coach or a Dancer, never an Organizer (ADR 0003).
    pg.check("event_rosters_roster_type", isRosterTypeSql()),
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
    // Rosters are uploaded as Coaches or Dancers; there is no organizer CSV.
    type: orgMemberType().$type<RosterType>().notNull(),
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
  (table) => [
    pg.index().on(table.eventId, table.createdAt),
    pg.check("csv_uploads_roster_type", isRosterTypeSql()),
  ]
);

/**
 * A per-row snapshot of what a roster CSV actually contained.
 *
 * The uploaded file itself is not kept, and the roster entries it creates are
 * mutable — attaching an account rewrites an entry's email and name in place.
 * Without this, "what did the spreadsheet say for this dancer, and what did it
 * do?" becomes unanswerable the moment anything downstream edits the entry,
 * which is exactly when someone asks.
 */
export const csvUploadRows = pg.pgTable(
  "csv_upload_rows",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    csvUploadId: pg
      .uuid()
      .notNull()
      .references(() => csvUploads.id, { onDelete: "cascade" }),
    rowNumber: pg.integer().notNull(),
    // The identity as written in the file — deliberately a copy, never a join,
    // so later edits to the roster entry cannot rewrite history.
    email: citext().notNull(),
    firstName: pg.text(),
    lastName: pg.text(),
    bibNumber: pg.integer(),
    paid: pg.boolean(),
    outcome: csvRowOutcome().notNull(),
    rosterId: pg
      .uuid()
      .references(() => eventRosters.id, { onDelete: "set null" }),
    // The account this row matched at upload time, if any. Null means the row
    // produced an invite rather than an immediate link.
    matchedUserId: pg.uuid().references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.csvUploadId),
    // Drives "show me every CSV line ever uploaded for this address".
    pg.index().on(table.email),
    pg.index().on(table.rosterId),
  ]
);

/**
 * A dancer asking an org to connect her account to a roster entry.
 *
 * A roster entry's email is the org's *contact* address, which is frequently a
 * parent's. The dancer then signs in with her own address, finds nothing, and
 * creates a second account — the entry is already claimed by the parent's
 * account, so nothing can link them automatically. This is the request that
 * used to arrive as a support email.
 *
 * Deliberately a request, not an action: resolving it reassigns a roster entry
 * away from whoever holds it, which only an org admin may decide. The dancer
 * supplies the claim; the admin verifies it against the roster.
 */
export const rosterClaimRequests = pg.pgTable(
  "roster_claim_requests",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    orgId: pg
      .uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // The account that will receive the roster entry if this is approved.
    requesterId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // What the dancer tells us to help an admin find her on the roster. Free
    // text on purpose: she may know only the name her studio registered her
    // under, or the address a parent used.
    claimedFirstName: pg.text().notNull(),
    claimedLastName: pg.text().notNull(),
    claimedEmail: citext(),
    note: pg.text(),
    status: rosterClaimStatus().notNull().default("pending"),
    // Set when approved — the entry the admin decided this claim refers to.
    resolvedRosterId: pg
      .uuid()
      .references(() => eventRosters.id, { onDelete: "set null" }),
    resolvedBy: pg.uuid().references(() => users.id, { onDelete: "set null" }),
    resolvedAt: pg.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.orgId, table.status),
    pg.index().on(table.requesterId),
    // One open claim per dancer per org: re-asking should update the queue,
    // not flood it.
    pg
      .uniqueIndex("roster_claim_requests_one_open_per_requester")
      .on(table.orgId, table.requesterId)
      .where(sql`status = 'pending'`),
  ]
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
  (table) => [pg.index().on(table.eventId), pg.index().on(table.categoryId)]
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
