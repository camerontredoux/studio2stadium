/**
 * A short mono age for widget rows: "now", "12m", "3h", "2d". Future times
 * (clock skew) read as "now".
 */
export function shortAge(value: string | Date, now: Date = new Date()): string {
  const then = typeof value === "string" ? new Date(value) : value;
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** `shortAge` with " ago", except for "now". */
export function agoLabel(value: string | Date, now: Date = new Date()): string {
  const age = shortAge(value, now);
  return age === "now" ? "just now" : `${age} ago`;
}

/**
 * A past or future time from now: "3h ago", "in 2d", "just now". For invite
 * sent and expiry times, where the future matters.
 */
export function relativeTime(
  value: string | Date,
  now: Date = new Date(),
): string {
  const then = typeof value === "string" ? new Date(value) : value;
  const diff = then.getTime() - now.getTime();
  if (!Number.isFinite(diff)) return "just now";
  if (diff <= 0) return agoLabel(then, now);
  const age = shortAge(now, then);
  return age === "now" ? "in under a minute" : `in ${age}`;
}
