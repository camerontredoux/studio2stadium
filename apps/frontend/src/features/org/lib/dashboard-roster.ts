/**
 * The roster entry a coach or dancer dashboard is built on. Members get
 * their own entry. Staff previewing the dashboard get their entry on the
 * active Org Event, the one admins edit, or null when they have none there,
 * so an older staff entry never pins the preview to a past event.
 */
export function dashboardRoster<R extends { id: string; eventId: string }>(
  rosters: R[],
  {
    isAdmin,
    myRoster,
    activeEventId,
  }: { isAdmin: boolean; myRoster: R | null; activeEventId?: string },
): R | null {
  if (isAdmin && activeEventId) {
    return rosters.find((roster) => roster.eventId === activeEventId) ?? null;
  }
  return (
    rosters.find((roster) => roster.id === myRoster?.id) ?? rosters[0] ?? null
  );
}
