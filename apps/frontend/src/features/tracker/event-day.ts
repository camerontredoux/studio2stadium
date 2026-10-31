import { format } from "date-fns";

// The calendar day an event starts on, in the dancer's time zone, in the
// `yyyy-MM-dd` form a tracker item's date uses.
export function eventDay(event: { startDatetime: string }) {
  return format(new Date(event.startDatetime), "yyyy-MM-dd");
}
