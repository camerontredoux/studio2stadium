import vine from "@vinejs/vine";
import { DateTime } from "luxon";
import {
  isValidTime,
  isValidTimezone,
  type EventSchedule,
} from "#utils/event-time";

/**
 * An Org Event's dates and daily hours that break a rule below. Create and
 * update answer it with 422 and its message.
 */
export class EventScheduleError extends Error {}

function isValidDate(ymd: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(ymd) &&
    DateTime.fromISO(ymd, { zone: "utc" }).isValid
  );
}

/**
 * The rules for an Org Event's dates and daily hours, checked on the whole
 * event (for an update, the stored row with the patch applied):
 *
 * - `startDate` and `endDate` are real dates, and the end isn't before the start.
 * - Times are "HH:mm" (00-23, 00-59) and the zone is a known IANA zone.
 * - `startTime` and `timezone` are set together or not at all.
 * - `endTime` needs `startTime` and `timezone`, and is after `startTime`. The
 *   hours apply to every day of the event, so there are no overnight hours.
 */
export function assertEventSchedule(event: EventSchedule): void {
  if (!isValidDate(event.startDate)) {
    throw new EventScheduleError("Start date must be a real date.");
  }
  if (!isValidDate(event.endDate)) {
    throw new EventScheduleError("End date must be a real date.");
  }
  if (event.endDate < event.startDate) {
    throw new EventScheduleError("End date can't be before the start date.");
  }
  if (event.startTime !== null && !isValidTime(event.startTime)) {
    throw new EventScheduleError("Start time must be a 24-hour HH:mm time.");
  }
  if (event.endTime !== null && !isValidTime(event.endTime)) {
    throw new EventScheduleError("End time must be a 24-hour HH:mm time.");
  }
  if (event.timezone !== null && !isValidTimezone(event.timezone)) {
    throw new EventScheduleError("Timezone must be a known IANA time zone.");
  }
  if (!!event.startTime !== !!event.timezone) {
    throw new EventScheduleError(
      "startTime and timezone must be provided together or not at all."
    );
  }
  if (event.endTime !== null) {
    if (!event.startTime) {
      throw new EventScheduleError("End time needs a start time and timezone.");
    }
    if (event.endTime <= event.startTime) {
      throw new EventScheduleError("End time must be after the start time.");
    }
  }
}

/** VineJS fields shared by the create and update validators. */
export const dateField = () => vine.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const timeField = () =>
  vine
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const timezoneRule = vine.createRule((value, _, field) => {
  if (typeof value !== "string" || !isValidTimezone(value)) {
    field.report(
      "The {{ field }} field must be a known IANA time zone",
      "timezone",
      field
    );
  }
});
export const timezoneField = () => vine.string().trim().use(timezoneRule());
