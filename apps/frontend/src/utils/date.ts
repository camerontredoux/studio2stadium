import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";

export function dateToRelativeTime(
  date: Date | string | number | undefined,
  opts: { strict: boolean } = { strict: false },
) {
  if (!date) return "";

  if (opts.strict) {
    return formatDistanceToNowStrict(new Date(date), {
      addSuffix: true,
    });
  }

  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
  });
}
