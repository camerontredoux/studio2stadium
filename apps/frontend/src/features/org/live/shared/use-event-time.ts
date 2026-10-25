import { useMemo } from "react";

import type { OrgEvent } from "@/features/org/api/admin-queries";
import { useNow } from "@/features/org/hooks/use-now";

import { eventDayInfo, type EventDayInfo } from "./event-time";

/** `eventDayInfo` on a clock that ticks every minute; null without an event. */
export function useEventDayInfo(event: OrgEvent | null): EventDayInfo | null {
  const now = useNow();
  return useMemo(() => (event ? eventDayInfo(event, now) : null), [event, now]);
}
