import * as pg from "drizzle-orm/pg-core";
import {
  competitiveCircuitType,
  schoolApplicationStatus,
  teamSelectionType,
} from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { users } from "./users.ts";

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
  idType: pg.text().notNull(),
  mediaId: pg.text().notNull(),
  status: schoolApplicationStatus().notNull().default("pending"),
  location: pg.text().notNull(),
  notes: pg.text(),
  ...timestamps,
});
