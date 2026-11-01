import { createContext } from "react";

import type { OrgMemberType, RosterType } from "@/lib/access";
import type {
  EventTierCapability,
  OrgFeatureKey,
} from "@/features/org/lib/entitlement";

export interface OrgMembership {
  role: "admin" | "member";
  /**
   * The user's highest-privilege membership type. A person may hold both an
   * organizer and a coach membership in the same Org (ADR 0003).
   */
  type: OrgMemberType;
}

export interface MyRoster {
  id: string;
  eventId: string;
  type: RosterType;
  eventName: string;
  eventStartDate: string;
  eventEndDate: string;
  isActive: boolean;
  hasStarted: boolean;
  /** What this roster's Org Event includes, overrides applied. */
  capabilities: EventTierCapability[];
}

export interface OrgContextValue {
  org: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
  };
  features: Record<string, boolean>;
  settings: Record<string, unknown>;
  membership: OrgMembership | null;
  myRoster: MyRoster | null;
  myRosters: MyRoster[];
  isAdmin: boolean;
  /**
   * Whether any of the Org's events was bought. Only S2S staff create further
   * events in a self-serve Org (#112).
   */
  selfServe: boolean;
  /**
   * Whether S2S staff ever put one of the Org's events below Enterprise. Only
   * staff create further events in a tier-managed Org either.
   */
  tierManaged: boolean;
  /**
   * Whether an Org Event includes a capability, or the Org includes a piece of
   * org-wide configuration. Pass `eventId` when the gated request names its
   * event, as a Dancer's reads do; leave it out for the Org's active event.
   * Convenience gating only — the backend's `OrgFeatureMiddleware` is
   * authoritative.
   */
  hasFeature: (key: OrgFeatureKey, eventId?: string) => boolean;
}

export const OrgContext = createContext<OrgContextValue | null>(null);
