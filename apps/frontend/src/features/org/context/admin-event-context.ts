import { createContext } from "react";

import type { OrgEvent } from "@/features/org/api/admin-queries";

export interface AdminEventContextValue {
  activeEvent: OrgEvent | null;
  events: OrgEvent[];
  selectedEvent: OrgEvent | null;
  selectEvent: (eventId: string) => void;
}

export const AdminEventContext = createContext<AdminEventContextValue | null>(
  null,
);

export function resolveAdminEventSelection(
  events: OrgEvent[],
  selectedEventId: string | null,
): OrgEvent | null {
  return (
    events.find((event) => event.id === selectedEventId) ??
    events.find((event) => event.isActive) ??
    events[0] ??
    null
  );
}
