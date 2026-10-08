import { sql } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";
import { dancerProfiles } from "./dancers.ts";
import { trackerItemType } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";

/**
 * One row per thing a dancer tracks in the Recruiting Tracker. `school` is
 * free text: the tracker groups items into one section per school name, and
 * items without a school fall under "Everything else". A dancer has at most
 * one `school` item per school name; it holds the school journey's stage.
 */
export const trackerItems = pg.pgTable(
  "tracker_items",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    dancerId: pg
      .uuid()
      .notNull()
      .references(() => dancerProfiles.id, { onDelete: "cascade" }),
    type: trackerItemType().notNull(),
    title: pg.text().notNull(),
    school: pg.text(),
    date: pg.date({ mode: "string" }),
    notes: pg.text(),
    // Index into the per-type stage list (see #modules/tracker/stages).
    stage: pg.smallint().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.dancerId, table.createdAt),
    pg
      .uniqueIndex("tracker_items_dancer_school_journey")
      .on(table.dancerId, table.school)
      .where(sql`${table.type} = 'school'`),
    pg.check("tracker_items_stage_nonnegative", sql`${table.stage} >= 0`),
  ]
);

/**
 * The order the dancer dragged their tracker sections into. Each entry is a
 * school name, or null for "Everything else".
 */
export const trackerSectionOrders = pg.pgTable("tracker_section_orders", {
  dancerId: pg
    .uuid()
    .primaryKey()
    .references(() => dancerProfiles.id, { onDelete: "cascade" }),
  sections: pg.jsonb().$type<(string | null)[]>().notNull().default([]),
  updatedAt: timestamps.updatedAt,
});
