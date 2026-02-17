import * as pg from "drizzle-orm/pg-core";
import { dancerProfiles } from "./dancers.ts";
import { timestamps } from "./helpers/columns.ts";
import { schoolProfiles } from "./schools.ts";

export const styles = pg.pgTable("profile_styles", {
  slug: pg.text().primaryKey(),
  name: pg.text().unique().notNull(),
});

export const dancerStyles = pg.pgTable(
  "dancer_styles",
  {
    dancerId: pg
      .uuid()
      .notNull()
      .references(() => dancerProfiles.id, { onDelete: "cascade" }),
    styleId: pg
      .text()
      .notNull()
      .references(() => styles.slug, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...timestamps,
  },
  (table) => [
    pg.primaryKey({ columns: [table.dancerId, table.styleId] }),
    pg.index().on(table.dancerId),
  ]
);

export const schoolStyles = pg.pgTable(
  "school_styles",
  {
    schoolId: pg
      .uuid()
      .notNull()
      .references(() => schoolProfiles.id, { onDelete: "cascade" }),
    styleId: pg
      .text()
      .notNull()
      .references(() => styles.slug, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    ...timestamps,
  },
  (table) => [
    pg.primaryKey({ columns: [table.schoolId, table.styleId] }),
    pg.index().on(table.schoolId),
  ]
);
