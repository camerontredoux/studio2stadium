import * as pg from "drizzle-orm/pg-core";
import { dancerProfiles } from "./dancers.ts";
import { timestamps } from "./helpers/columns.ts";
import { schoolProfiles } from "./schools.ts";

export const skills = pg.pgTable(
  "profile_skills",
  {
    id: pg.text().primaryKey(),
    name: pg.text().unique().notNull(),
    category: pg.text().notNull(),
  },
  (table) => [pg.index().on(table.category)]
);

export const dancersToSkills = pg.pgTable(
  "dancers_to_skills",
  {
    dancerId: pg
      .uuid()
      .notNull()
      .references(() => dancerProfiles.id, { onDelete: "cascade" }),
    skillId: pg
      .text()
      .notNull()
      .references(() => skills.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...timestamps,
  },
  (table) => [pg.primaryKey({ columns: [table.dancerId, table.skillId] })]
);

export const schoolsToSkills = pg.pgTable(
  "schools_to_skills",
  {
    schoolId: pg
      .uuid()
      .notNull()
      .references(() => schoolProfiles.id, { onDelete: "cascade" }),
    skillId: pg
      .text()
      .notNull()
      .references(() => skills.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    weight: pg.integer().default(1),
    ...timestamps,
  },
  (table) => [pg.primaryKey({ columns: [table.schoolId, table.skillId] })]
);
