import { useMemo, useState, type ReactNode } from "react";

import {
  ActiveEventScopeContext,
  type EventArea,
} from "./active-event-scope-context";

/**
 * Says which area (admin, coach, dancer) the views below belong to, and holds
 * the dancer's chosen Org Event so the sidebar switcher and the pages agree.
 * Mounted by each area shell.
 */
export function ActiveEventScope({
  area,
  children,
}: {
  area: EventArea;
  children: ReactNode;
}) {
  const [dancerEventId, setDancerEventId] = useState("");
  const value = useMemo(
    () => ({ area, dancerEventId, setDancerEventId }),
    [area, dancerEventId],
  );
  return (
    <ActiveEventScopeContext.Provider value={value}>
      {children}
    </ActiveEventScopeContext.Provider>
  );
}
