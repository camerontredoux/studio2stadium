/** The US zones an Org Event can use, each with a plain-language name. */
export const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern (America/New_York)" },
  { value: "America/Chicago", label: "Central (America/Chicago)" },
  { value: "America/Denver", label: "Mountain (America/Denver)" },
  { value: "America/Los_Angeles", label: "Pacific (America/Los_Angeles)" },
  { value: "America/Phoenix", label: "Arizona (America/Phoenix)" },
  { value: "America/Anchorage", label: "Alaska (America/Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Pacific/Honolulu)" },
];

/**
 * The US zones, plus `current` when it was saved before the list was limited
 * to the US, so the field can still show and keep it.
 */
export function timezoneOptions(current?: string | null): string[] {
  const values = US_TIMEZONES.map((tz) => tz.value);
  return current && !values.includes(current) ? [...values, current] : values;
}

/** The label shown for a saved timezone value ("Eastern (America/New_York)"). */
export function timezoneLabel(value: string) {
  return US_TIMEZONES.find((tz) => tz.value === value)?.label ?? value;
}
