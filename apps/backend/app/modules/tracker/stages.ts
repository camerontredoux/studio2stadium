import { type db } from "#database/connection";
import { type trackerItemType } from "#database/schema/enums";
import { danceEvents } from "#database/schema/events";
import { schoolProfiles } from "#database/schema/schools";
import { trackerItems } from "#database/schema/tracker";
import { users } from "#database/schema/users";
import { imageUrl } from "#utils/image-url";
import { errors } from "@vinejs/vine";
import { E_DATABASE_ERROR } from "#exceptions/database";
import { and, desc, eq, isNotNull, ne, or, sql } from "drizzle-orm";

type Client = typeof db;

export type TrackerItemType = (typeof trackerItemType.enumValues)[number];

/**
 * Stage labels per tracker item type, in order. An item's `stage` is an index
 * into its type's list; the last stage means the item is done. The frontend
 * shows these labels, so keep the two lists in step.
 */
export const STAGES: Record<TrackerItemType, readonly string[]> = {
  school: [
    "Interested",
    "Reached out",
    "Visited",
    "Auditioned",
    "Offer",
    "Committed",
  ],
  clinic: ["Planning", "Registered", "Attended"],
  audition: ["Preparing", "Registered", "Auditioned"],
  application: ["Not started", "In progress", "Submitted"],
  deadline: ["Upcoming", "Done"],
};

/**
 * Rejects a stage outside the item type's list with the same 422 shape
 * VineJS uses, so clients handle it like any other validation error.
 */
export function assertStage(type: TrackerItemType, stage: number) {
  const last = STAGES[type].length - 1;
  if (stage > last) {
    throw new errors.E_VALIDATION_ERROR([
      {
        field: "stage",
        rule: "max",
        message: `The stage field must not be greater than ${last} for a ${type} item`,
      },
    ]);
  }
}

/** The school journey's last stage. A dancer commits to one school at most. */
export const COMMITTED = STAGES.school.length - 1;

export class AlreadyTrackingSchoolError extends Error {
  code = "E_ALREADY_TRACKING_SCHOOL";
  constructor() {
    super("This school is already in your tracker.");
  }
}

export class AlreadyCommittedError extends Error {
  code = "E_ALREADY_COMMITTED";
  constructor() {
    super("You've already committed to a school.");
  }
}

/**
 * Rejects committing to a school when the dancer already committed to
 * another. `itemId` is the item being changed, which may already be the
 * committed one.
 */
export async function assertNotCommitted(
  db: Client,
  dancerId: string,
  itemId?: string
) {
  const [committed] = await db
    .select({ id: trackerItems.id })
    .from(trackerItems)
    .where(
      and(
        eq(trackerItems.dancerId, dancerId),
        eq(trackerItems.type, "school"),
        eq(trackerItems.stage, COMMITTED),
        itemId ? ne(trackerItems.id, itemId) : undefined
      )
    );
  if (committed) throw new AlreadyCommittedError();
}

/**
 * Maps a unique violation to the tracker's 409 errors. Two requests can race
 * past the checks, so the unique indexes have the final say: the commitment
 * index is on `dancer_id` alone, and the school index on both columns.
 */
export function conflictError(error: unknown) {
  if (
    error instanceof E_DATABASE_ERROR &&
    error.code === "E_UNIQUE_VIOLATION"
  ) {
    return error.cause === "dancer_id"
      ? new AlreadyCommittedError()
      : new AlreadyTrackingSchoolError();
  }
  return error;
}

// Dates are calendar days ("YYYY-MM-DD"). VineJS parses them as local
// midnight, so format with local getters to round-trip the same day.
export function toCalendarDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Rejects a schoolId that isn't in the schools directory with a 422. */
export async function assertSchoolExists(db: Client, schoolId: string) {
  const [school] = await db
    .select({ id: schoolProfiles.id })
    .from(schoolProfiles)
    .where(eq(schoolProfiles.id, schoolId));
  if (!school) {
    throw new errors.E_VALIDATION_ERROR([
      {
        field: "schoolId",
        rule: "exists",
        message: "The selected school does not exist",
      },
    ]);
  }
}

/** Only a clinic item links an event. */
export const EVENT_TYPE: TrackerItemType = "clinic";

/**
 * Rejects an event a clinic item can't link with a 422: an event of another
 * item type, one the dancer can't see (its school isn't verified), or one the
 * item's school doesn't host. The event may have passed, so an item keeps
 * its event after the day.
 */
export async function assertEventFits(
  db: Client,
  type: TrackerItemType,
  eventId: string,
  schoolId: string | null
) {
  const fail = (rule: string, message: string) =>
    new errors.E_VALIDATION_ERROR([{ field: "eventId", rule, message }]);

  if (type !== EVENT_TYPE) {
    throw fail("type", `Only a ${EVENT_TYPE} item can link an event`);
  }
  const [event] = await db
    .select({ schoolId: danceEvents.schoolId })
    .from(danceEvents)
    .innerJoin(schoolProfiles, eq(schoolProfiles.id, danceEvents.schoolId))
    .innerJoin(users, eq(users.id, schoolProfiles.userId))
    .where(and(eq(danceEvents.id, eventId), eq(users.verified, true)));
  if (!event) {
    throw fail("exists", "The selected event does not exist");
  }
  if (schoolId && event.schoolId !== schoolId) {
    throw fail("school", "The selected school doesn't host this event");
  }
}

/**
 * The dancer's items as clients see them, with the school and event
 * summaries. A school item's title is its school's name. A school item whose school was deleted
 * is hidden.
 */
export async function findItems(db: Client, dancerId: string, itemId?: string) {
  const rows = await db
    .select({
      id: trackerItems.id,
      type: trackerItems.type,
      title: sql<string>`coalesce(${trackerItems.title}, ${schoolProfiles.name})`,
      school: {
        id: schoolProfiles.id,
        name: schoolProfiles.name,
        username: users.username,
        avatar: users.avatar,
      },
      event: {
        id: danceEvents.id,
        title: danceEvents.title,
        startDatetime: danceEvents.startDatetime,
      },
      date: trackerItems.date,
      notes: trackerItems.notes,
      stage: trackerItems.stage,
      createdAt: trackerItems.createdAt,
      updatedAt: trackerItems.updatedAt,
    })
    .from(trackerItems)
    .leftJoin(schoolProfiles, eq(schoolProfiles.id, trackerItems.schoolId))
    .leftJoin(users, eq(users.id, schoolProfiles.userId))
    .leftJoin(danceEvents, eq(danceEvents.id, trackerItems.eventId))
    .where(
      and(
        eq(trackerItems.dancerId, dancerId),
        itemId ? eq(trackerItems.id, itemId) : undefined,
        or(ne(trackerItems.type, "school"), isNotNull(trackerItems.schoolId))
      )
    )
    .orderBy(desc(trackerItems.createdAt), desc(trackerItems.id));

  // Drizzle returns an unmatched left-joined school as all-null fields. The
  // event comes from one table, so Drizzle already returns it as null.
  return rows.map(({ school: { id, name, username, avatar }, ...item }) => ({
    ...item,
    school:
      id && name && username
        ? { id, name, username, avatar: imageUrl(avatar, "avatar") }
        : null,
  }));
}
