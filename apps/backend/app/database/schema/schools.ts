import * as pg from "drizzle-orm/pg-core";
import {
  competitiveCircuitType,
  schoolApplicationStatus,
  teamSelectionType,
} from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { users } from "./users.ts";
import { orgEvents, eventRosters } from "./org-events.ts";

export const schoolProfiles = pg.pgTable(
  "school_profiles",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    name: pg.text().notNull().unique(),
    location: pg.text().notNull(),
    city: pg.text(),
    commonRecruiting: pg.boolean().notNull().default(false),
    teamSelection: teamSelectionType().notNull().default("recruitment"),
    competitiveCircuit: competitiveCircuitType()
      .notNull()
      .default("non-competitive"),
    division: pg.text(),
    benefits: pg.text(),
    about: pg.text(),
    website: pg.text(),
    timeCommitment: pg.text(),
    headCoach: pg.text(),
    assistantCoach: pg.text(),
    missionStatement: pg.text(),
    whatWeDo: pg.text(),
    gpa: pg.doublePrecision(),
    size: pg.integer(),
    tiktok: pg.text(),
    instagram: pg.text(),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.userId),
    pg.index().on(table.gpa),
    pg.index().on(table.division),
    pg.index().on(table.location),
    pg.index().on(table.teamSelection),
    pg.index().on(table.competitiveCircuit),
  ]
);

export const schoolApplications = pg.pgTable("school_applications", {
  id: pg.uuid().primaryKey().defaultRandom(),
  schoolId: pg
    .uuid()
    .notNull()
    .unique()
    .references(() => schoolProfiles.id, { onDelete: "cascade" }),
  mediaId: pg.text().notNull(),
  status: schoolApplicationStatus().notNull().default("pending"),
  notes: pg.text(),
  ...timestamps,
});

export const schoolInvites = pg.pgTable(
  "school_invites",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    email: pg.text().notNull(),
    organization: pg.text(),
    token: pg.text().notNull().unique(),
    expiresAt: pg.timestamp({ withTimezone: true }).notNull(),
    consumedAt: pg.timestamp({ withTimezone: true }),
    createdAt: pg.timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    pg.uniqueIndex("school_invites_event_email").on(t.eventId, t.email),
    pg.index().on(t.token),
  ]
);

export const suggestedClaimDismissals = pg.pgTable(
  "suggested_claim_dismissals",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    createdAt: pg.timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    pg
      .uniqueIndex("suggested_claim_dismissals_user_roster")
      .on(t.userId, t.rosterId),
  ]
);
