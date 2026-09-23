import { useSearch } from "@tanstack/react-router";

import { useOrg } from "@/features/org/context/use-org";
import { viewedDancerEventId } from "@/features/org/lib/entitlement";

/**
 * The event a Dancer is viewing in the org area — the one her event switcher
 * put in the URL, else her first dancer roster. Her pages request this event
 * and her menu gates on it, so both describe the same event (#110).
 */
export function useViewedDancerEventId(): string | undefined {
  const { eventId } = useSearch({ strict: false }) as { eventId?: string };
  const { myRosters } = useOrg();
  return viewedDancerEventId(myRosters, eventId);
}
