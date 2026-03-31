import * as pg from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { timestamps } from "./helpers/columns.ts";
import { studioApplicationStatus } from "./enums.ts";

export const studioProfiles = pg.pgTable(
    "studio_profiles",
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
        about: pg.text(),
        website: pg.text(),
        headCoach: pg.text(),
        assistantCoach: pg.text(),
        missionStatement: pg.text(),
        size: pg.integer(),
        tiktok: pg.text(),
        instagram: pg.text(),
        ...timestamps,
    },
    (table) => [
        pg.index().on(table.userId),
        pg.index().on(table.location),
        pg.index().on(table.size),
    ]
)

export const studioApplications = pg.pgTable("studio_applications", {
    id: pg.uuid().primaryKey().defaultRandom(),
    studioId: pg
        .uuid()
        .notNull()
        .unique()
        .references(() => studioProfiles.id, { onDelete: "cascade" }),
    status: studioApplicationStatus().notNull().default("pending"),
    notes: pg.text(),
    ...timestamps,
});
