import { type trackerItemType } from "#database/schema/enums";
import { trackerItems } from "#database/schema/tracker";
import { errors } from "@vinejs/vine";

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

// Dates are calendar days ("YYYY-MM-DD"). VineJS parses them as local
// midnight, so format with local getters to round-trip the same day.
export function toCalendarDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// What clients see of an item (everything but the owner).
export const itemFields = {
  id: trackerItems.id,
  type: trackerItems.type,
  title: trackerItems.title,
  school: trackerItems.school,
  date: trackerItems.date,
  notes: trackerItems.notes,
  stage: trackerItems.stage,
  createdAt: trackerItems.createdAt,
  updatedAt: trackerItems.updatedAt,
};
