import { DateTime } from "luxon";

function fallbackEventStart(startDate: string): Date {
  const [y, m, d] = startDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toEventStartUtc(
  startDate: string,
  startTime: string,
  timezone: string
): Date {
  const eventStart = DateTime.fromFormat(
    `${startDate} ${startTime}`,
    "yyyy-MM-dd HH:mm",
    { zone: timezone }
  );

  return eventStart.isValid
    ? eventStart.toUTC().toJSDate()
    : fallbackEventStart(startDate);
}

export function hasEventStarted(
  startDate: string,
  startTime: string | null,
  timezone: string | null
): boolean {
  if (startTime && timezone) {
    return (
      Date.now() >= toEventStartUtc(startDate, startTime, timezone).getTime()
    );
  }
  return Date.now() >= fallbackEventStart(startDate).getTime();
}

const CHECK_IN_LEAD_MS = 60 * 60 * 1000;

export function isCheckInOpen(
  startDate: string,
  startTime: string | null,
  timezone: string | null
): boolean {
  if (startTime && timezone) {
    return (
      Date.now() >=
      toEventStartUtc(startDate, startTime, timezone).getTime() -
        CHECK_IN_LEAD_MS
    );
  }
  return (
    Date.now() >= fallbackEventStart(startDate).getTime() - CHECK_IN_LEAD_MS
  );
}
