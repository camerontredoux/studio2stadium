export function toEventStartUtc(
  startDate: string,
  startTime: string,
  timezone: string,
): Date {
  const [y, m, d] = startDate.split("-").map(Number);
  const [h, min] = startTime.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(y, m - 1, d, h, min));
  const inTz = new Date(
    utcGuess.toLocaleString("en-US", { timeZone: timezone }),
  );
  const offset = utcGuess.getTime() - inTz.getTime();
  return new Date(utcGuess.getTime() + offset);
}

export function hasEventStarted(
  startDate: string,
  startTime: string | null,
  timezone: string | null,
): boolean {
  if (startTime && timezone) {
    return Date.now() >= toEventStartUtc(startDate, startTime, timezone).getTime();
  }
  const [y, m, d] = startDate.split("-").map(Number);
  const startOfDay = new Date(y, m - 1, d);
  return Date.now() >= startOfDay.getTime();
}
