import * as pg from "drizzle-orm/pg-core";
import { dancerProfiles } from "./dancers.ts";
import { timestamps } from "./helpers/columns.ts";
import { schoolProfiles } from "./schools.ts";

export const sports = pg.pgTable("profile_sports", {
  slug: pg.text().primaryKey(),
  name: pg.text().unique().notNull(),
});

export const dancerSports = pg.pgTable(
  "dancer_sports",
  {
    dancerId: pg
      .uuid()
      .notNull()
      .references(() => dancerProfiles.id, { onDelete: "cascade" }),
    sportId: pg
      .text()
      .notNull()
      .references(() => sports.slug, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...timestamps,
  },
  (table) => [pg.primaryKey({ columns: [table.dancerId, table.sportId] })]
);

export const schoolSports = pg.pgTable(
  "school_sports",
  {
    schoolId: pg
      .uuid()
      .notNull()
      .references(() => schoolProfiles.id, { onDelete: "cascade" }),
    sportId: pg
      .text()
      .notNull()
      .references(() => sports.slug, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...timestamps,
  },
  (table) => [pg.primaryKey({ columns: [table.schoolId, table.sportId] })]
);
