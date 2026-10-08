import { sql } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";
import { dancerProfiles } from "./dancers.ts";
import { trackerItemType } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { schoolProfiles } from "./schools.ts";

/**
 * One row per thing a dancer tracks in the Recruiting Tracker. The tracker
 * groups items into one section per school (`school_id`); items without a
 * school fall under "Everything else". A dancer has at most one `school` item
 * per school; it holds the school journey's stage and takes its title from
 * the school, so only the other types store a title.
 *
 * Deleting a school sets `school_id` to null: the dancer's other items move
 * to "Everything else", and the orphaned `school` item is hidden from lists.
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
    title: pg.text(),
    schoolId: pg
      .uuid()
      .references(() => schoolProfiles.id, { onDelete: "set null" }),
    date: pg.date({ mode: "string" }),
    notes: pg.text(),
    // Index into the per-type stage list (see #modules/tracker/stages).
    stage: pg.smallint().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.dancerId, table.createdAt),
    pg.index().on(table.schoolId),
    pg
      .uniqueIndex("tracker_items_dancer_school_journey")
      .on(table.dancerId, table.schoolId)
      .where(sql`${table.type} = 'school'`),
    pg.check("tracker_items_stage_nonnegative", sql`${table.stage} >= 0`),
    pg.check(
      "tracker_items_title_required",
      sql`${table.type} = 'school' or ${table.title} is not null`
    ),
  ]
);

/**
 * The order the dancer dragged their tracker sections into. Each entry is a
 * school id, or null for "Everything else".
 */
export const trackerSectionOrders = pg.pgTable("tracker_section_orders", {
  dancerId: pg
    .uuid()
    .primaryKey()
    .references(() => dancerProfiles.id, { onDelete: "cascade" }),
  sections: pg.jsonb().$type<(string | null)[]>().notNull().default([]),
  updatedAt: timestamps.updatedAt,
});
