import type { OrgEvent } from "@/features/org/api/admin-queries";
import {
  formatRailDate,
  normalizeTime,
  timeZoneAbbr,
} from "@/features/org/live/shared/event-time";

/** Check-in opens this long before the event's start (backend `isCheckInOpen`). */
const OPENS_BEFORE_MIN = 60;

function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "2026-11-12" for "2026-11-13". */
function previousDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) - 1));
  return date.toISOString().slice(0, 10);
}

/**
 * "Check-in opens Fri, Nov 13 at 7:00 AM CST": one hour before the event's
 * first-day start time, in the event's zone. Without a start time, "Check-in
 * opens on event day".
 */
export function checkInOpensText(
  event: Pick<OrgEvent, "startDate" | "timezone">,
  startTime: string | null,
  timezone: string | null,
): string {
  const start = normalizeTime(startTime);
  if (!start) return "Check-in opens on event day";
  const [h, m] = start.split(":").map(Number);
  const opens = (h ?? 0) * 60 + (m ?? 0) - OPENS_BEFORE_MIN;
  // An event starting before 01:00 opens the evening before.
  const dayBefore = opens < 0;
  const clock = formatClock(dayBefore ? opens + 24 * 60 : opens);
  const day = dayBefore ? previousDay(event.startDate) : event.startDate;
  const zone = timeZoneAbbr({
    startDate: event.startDate,
    timezone: timezone ?? event.timezone,
  });
  return `Check-in opens ${formatRailDate(day)} at ${clock}${zone ? ` ${zone}` : ""}`;
}
