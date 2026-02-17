import { formatDistanceToNow } from "date-fns";

export function dateToRelativeTime(date: Date | string | number | undefined) {
  if (!date) return "";

  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
  });
}
