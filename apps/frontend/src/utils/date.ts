import { formatDistanceToNowStrict } from "date-fns";

export function dateToRelativeTime(date: Date | string | number | undefined) {
  if (!date) return "";

  return formatDistanceToNowStrict(new Date(date), {
    addSuffix: true,
  });
}
