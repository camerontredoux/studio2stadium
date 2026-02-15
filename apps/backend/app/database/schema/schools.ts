import * as pg from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/columns.ts";
import { users } from "./users.ts";

export const schoolProfiles = pg.pgTable(
  "school_profiles",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: pg.text().notNull().unique(),
    location: pg.text().notNull(),
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
    pg.index().on(table.gpa),
    pg.index().on(table.division),
    pg.index().on(table.location),
  ]
);
