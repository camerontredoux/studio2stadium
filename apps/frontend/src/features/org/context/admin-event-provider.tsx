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
      selectEvent: (eventId) => {
        if (events.some((event) => event.id === eventId)) {
          setSelectedEventId(eventId);
        }
      },
    }),
    [events, selectedEventId],
  );

  return (
    <AdminEventContext.Provider value={value}>
      {children}
    </AdminEventContext.Provider>
  );
}
