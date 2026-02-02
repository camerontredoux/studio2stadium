import * as pg from "drizzle-orm/pg-core";
import { dancerProfiles } from "./dancers.ts";
import { timestamps } from "./helpers/columns.ts";
import { schoolProfiles } from "./schools.ts";

export const styles = pg.pgTable("profile_styles", {
  id: pg.text().primaryKey(),
  name: pg.text().unique().notNull(),
});

export const dancersToStyles = pg.pgTable(
  "dancers_to_styles",
  {
    dancerId: pg
      .uuid()
      .notNull()
      .references(() => dancerProfiles.id, { onDelete: "cascade" }),
    styleId: pg
      .text()
      .notNull()
      .references(() => styles.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...timestamps,
  },
  (table) => [pg.primaryKey({ columns: [table.dancerId, table.styleId] })]
);

export const schoolsToStyles = pg.pgTable(
  "schools_to_styles",
  {
    schoolId: pg
      .uuid()
      .notNull()
      .references(() => schoolProfiles.id, { onDelete: "cascade" }),
    styleId: pg
      .text()
      .notNull()
      .references(() => styles.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...timestamps,
  },
  (table) => [pg.primaryKey({ columns: [table.schoolId, table.styleId] })]
);
