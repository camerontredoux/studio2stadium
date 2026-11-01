import { useMemo, useState, type ReactNode } from "react";

import type { OrgEvent } from "@/features/org/api/admin-queries";
import {
  AdminEventContext,
  resolveAdminEventSelection,
  type AdminEventContextValue,
} from "./admin-event-context";

export function AdminEventProvider({
  children,
  events,
}: {
  children: ReactNode;
  events: OrgEvent[];
}) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const value = useMemo<AdminEventContextValue>(
    () => ({
      activeEvent: events.find((event) => event.isActive) ?? null,
      events,
      selectedEvent: resolveAdminEventSelection(events, selectedEventId),
      // An id not in `events` yet (an event just created, before the list
      // refetches) is kept and resolves once it arrives; until then the
      // selection falls back as usual.
      selectEvent: (eventId) => setSelectedEventId(eventId),
    }),
    [events, selectedEventId],
  );

  return (
    <AdminEventContext.Provider value={value}>
      {children}
    </AdminEventContext.Provider>
  );
}
