import { createContext, useContext } from "react";

/** Who is looking: admins see every school's callbacks, coaches only their own program's. */
export type DancerDialogViewer = "admin" | "coach";

/**
 * What the opener already knows about the dancer. Only `rosterId` is required;
 * pass whatever else the row has (bib and name at least) so the dialog renders
 * straight away. The dialog fetches the rest.
 */
export interface DancerDialogDancer {
  /** The dancer's Roster Entry id (`dancerRosterId`). */
  rosterId: string;
  bibNumber?: number | string | null;
  firstName?: string | null;
  lastName?: string | null;
  /** The Org Event the Roster Entry belongs to; used to look up roster fields. */
  eventId?: string | null;
  studio?: string | null;
  email?: string | null;
  gradYear?: number | null;
  gpa?: number | null;
  state?: string | null;
  height?: string | null;
  danceStyles?: string[] | null;
  profilePhotoUrl?: string | null;
  checkedInAt?: string | null;
  isRegistered?: boolean | null;
}

export interface DancerDialogOpenOptions {
  /** Shows "View full profile" in the footer (the coach's dancer sheet). */
  onViewProfile?: (rosterId: string) => void;
}

export interface DancerDialogContextValue {
  viewer: DancerDialogViewer;
  open: (dancer: DancerDialogDancer, options?: DancerDialogOpenOptions) => void;
}

const DancerDialogContext = createContext<DancerDialogContextValue | null>(
  null,
);

/**
 * Opens the shared dancer dialog from anywhere under `DancerDialogProvider`.
 * Returns null outside one (DancerBib then keeps its own dialog).
 */
export function useDancerDialog() {
  return useContext(DancerDialogContext);
}

export { DancerDialogContext };
