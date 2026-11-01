import { createContext } from "react";

export type EventArea = "admin" | "coach" | "dancer";

export interface ActiveEventScopeValue {
  area: EventArea;
  /** Dancers registered for several Org Events pick one; "" means the default. */
  dancerEventId: string;
  setDancerEventId: (eventId: string) => void;
}

export const ActiveEventScopeContext =
  createContext<ActiveEventScopeValue | null>(null);
