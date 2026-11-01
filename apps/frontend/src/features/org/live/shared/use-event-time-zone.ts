import { useActiveOrgEvent } from "./use-active-org-event";

/**
 * The zone this view's Org Event keeps time in: its own, else the one the
 * backend resolved (org default, else UTC). Null without an event, which
 * formats in the viewer's zone.
 */
export function useEventTimeZone(): string | null {
  const { event } = useActiveOrgEvent();
  return event?.timezone ?? event?.effectiveTimezone ?? null;
}
