import { useContext } from "react";

import { AdminEventContext } from "./admin-event-context";

export function useAdminEvent() {
  const context = useContext(AdminEventContext);
  if (!context) {
    throw new Error("useAdminEvent must be used inside <AdminEventProvider>");
  }
  return context;
}
