const FOURTEEN_DAYS_MS = 14 * 86400000;
const GRACE_DAYS_AFTER_EVENT_START = 7;

/**
 * School/coach invites must outlive far-future events: they expire at the
 * later of 14 days from issue or 7 days after the event starts.
 */
export function schoolInviteExpiry(
  eventStartDate: string | null | undefined
): Date {
  const minimumExpiry = new Date(Date.now() + FOURTEEN_DAYS_MS);
  if (!eventStartDate) return minimumExpiry;

  const eventExpiry = new Date(`${eventStartDate}T00:00:00`);
  if (Number.isNaN(eventExpiry.getTime())) return minimumExpiry;
  eventExpiry.setDate(eventExpiry.getDate() + GRACE_DAYS_AFTER_EVENT_START);

  return new Date(Math.max(minimumExpiry.getTime(), eventExpiry.getTime()));
}
