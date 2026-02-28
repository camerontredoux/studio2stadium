export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
] as const;

export const TIMEZONE_LABELS: Record<(typeof TIMEZONES)[number], string> = {
  "America/New_York": "Eastern Time",
  "America/Chicago": "Central Time",
  "America/Denver": "Mountain Time",
  "America/Phoenix": "Arizona",
  "America/Los_Angeles": "Pacific Time",
  "America/Anchorage": "Alaska Time",
  "Pacific/Honolulu": "Hawaii Time",
};

export const TIMEZONE_ITEMS = TIMEZONES.map((tz) => ({
  value: tz,
  label: TIMEZONE_LABELS[tz],
}));

export function getDefaultTimezone(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (TIMEZONES.includes(tz as (typeof TIMEZONES)[number])) {
    return tz;
  }
  return "America/New_York";
}
