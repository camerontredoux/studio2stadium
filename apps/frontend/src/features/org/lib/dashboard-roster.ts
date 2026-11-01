/**
 * The roster entry a coach or dancer dashboard is built on. Staff previewing
 * the dashboard get their entry on the active Org Event, the one admins edit,
 * or null when they have none there, so an older staff entry never pins the
 * preview to a past event. Everyone else, and staff while no active Org Event
 * is known, gets the entry matching `myRoster`, falling back to the first
 * entry in `rosters`, or null when `rosters` is empty.
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
