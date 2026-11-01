import { DateTime, IANAZone } from "luxon";

/**
 * Where an Org Event sits in time. The one place the backend turns an event's
 * dates, daily hours and zone into instants; nothing here reads the server's
 * own time zone.
 *
 * An event runs on every calendar day from `startDate` to `endDate`, during
 * its daily hours `startTime` to `endTime` ("HH:mm"), local to its zone.
 * Without a start time a day starts at 00:00; without an end time it runs to
 * the next day's 00:00.
 */
export interface EventSchedule {
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  timezone: string | null;
}

export interface EventDayWindow {
  /** The event day's calendar date, "YYYY-MM-DD", in the event zone. */
  date: string;
  start: Date;
  end: Date;
}

export interface EventInstants {
  /** The first day's start, as an ISO UTC instant. */
  startsAt: string;
  /** The last day's end, as an ISO UTC instant. */
  endsAt: string;
  /** The zone the instants were computed in (see {@link resolveEventZone}). */
  effectiveTimezone: string;
}

/** Self check-in opens this long before the first day's start time. */
export const CHECK_IN_LEAD_MS = 60 * 60 * 1000;

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(time: string): boolean {
  return HH_MM.test(time);
}

export function isValidTimezone(zone: string): boolean {
  return IANAZone.isValidZone(zone);
}

/**
 * The zone an event's times are read in: its own `timezone`, then the org's
 * default (`organizations.settings.defaultTimezone`), then UTC. A value that
 * isn't a known IANA zone is skipped.
 */
export function resolveEventZone(
  timezone: string | null | undefined,
  orgDefault?: string | null
): string {
  for (const zone of [timezone, orgDefault]) {
    if (zone && isValidTimezone(zone)) return zone;
  }
  return "UTC";
}

/** The org's default zone from its `settings` JSON, or null. */
export function orgDefaultTimezone(settings: unknown): string | null {
  const value = (settings as Record<string, unknown> | null)?.defaultTimezone;
  return typeof value === "string" && value ? value : null;
}

function atLocal(date: string, time: string | null, zone: string): DateTime {
  const day = DateTime.fromISO(date, { zone });
  if (!time || !isValidTime(time)) return day.startOf("day");
  const [hour, minute] = time.split(":").map(Number);
  return day.set({ hour, minute, second: 0, millisecond: 0 });
}

/** Calendar days the event runs, inclusive; at least 1. */
export function eventDayCount(
  event: Pick<EventSchedule, "startDate" | "endDate">
): number {
  const start = DateTime.fromISO(event.startDate, { zone: "utc" });
  const end = DateTime.fromISO(event.endDate, { zone: "utc" });
  return Math.max(1, Math.round(end.diff(start, "days").days) + 1);
}

/**
 * Day `day` (1-based) of the event: its date and its daily hours as instants.
 * Without an end time the day runs to the next day's 00:00 in the event zone.
 */
export function eventDayWindow(
  event: EventSchedule,
  day: number,
  orgDefault?: string | null
): EventDayWindow {
  const zone = resolveEventZone(event.timezone, orgDefault);
  const date = DateTime.fromISO(event.startDate, { zone: "utc" })
    .plus({ days: day - 1 })
    .toISODate()!;
  const start = atLocal(date, event.startTime, zone);
  const end = event.endTime
    ? atLocal(date, event.endTime, zone)
    : atLocal(date, null, zone).plus({ days: 1 });
  return { date, start: start.toJSDate(), end: end.toJSDate() };
}

export function eventStartsAt(
  event: EventSchedule,
  orgDefault?: string | null
): Date {
  return eventDayWindow(event, 1, orgDefault).start;
}

export function eventEndsAt(
  event: EventSchedule,
  orgDefault?: string | null
): Date {
  return eventDayWindow(event, eventDayCount(event), orgDefault).end;
}

/** `startsAt`, `endsAt` and the zone, for an Org Event response. */
export function eventInstants(
  event: EventSchedule,
  orgDefault?: string | null
): EventInstants {
  return {
    startsAt: eventStartsAt(event, orgDefault).toISOString(),
    endsAt: eventEndsAt(event, orgDefault).toISOString(),
    effectiveTimezone: resolveEventZone(event.timezone, orgDefault),
  };
}

/** An Org Event row with its instants added. */
export function withEventInstants<T extends EventSchedule>(
  event: T,
  orgDefault?: string | null
): T & EventInstants {
  return { ...event, ...eventInstants(event, orgDefault) };
}

/**
 * True from the first day's start onward, between days included. Gates
 * scouting.
 */
export function hasEventStarted(
  event: EventSchedule,
  orgDefault?: string | null,
  now: number = Date.now()
): boolean {
  return now >= eventStartsAt(event, orgDefault).getTime();
}

/**
 * Self check-in opens {@link CHECK_IN_LEAD_MS} before the first day's start
 * time and stays open, between days too. An event without a start time opens
 * at 00:00 on its start date in the event zone, not the evening before.
 */
export function checkInOpensAt(
  event: EventSchedule,
  orgDefault?: string | null
): Date {
  const startsAt = eventStartsAt(event, orgDefault);
  if (!event.startTime) return startsAt;
  return new Date(startsAt.getTime() - CHECK_IN_LEAD_MS);
}

export function isCheckInOpen(
  event: EventSchedule,
  orgDefault?: string | null,
  now: number = Date.now()
): boolean {
  return now >= checkInOpensAt(event, orgDefault).getTime();
}

/** Today's date, "YYYY-MM-DD", in `zone`. */
export function todayInZone(zone: string, now: number = Date.now()): string {
  return DateTime.fromMillis(now, { zone }).toISODate()!;
}

/**
 * When an org account tier earned from an event ending on `endDate` expires:
 * `months` calendar months after 00:00 UTC on that date. Plain UTC date
 * arithmetic, so the result doesn't depend on the server's zone; it matches
 * what `new Date(endDate)` plus `setMonth` gave on a UTC server, including
 * its roll-over past a short month's end (Jan 31 + 1 month is Mar 3).
 */
export function tierExpiryFrom(endDate: string, months: number): Date {
  const [year, month, day] = endDate.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1 + months, day!));
}
