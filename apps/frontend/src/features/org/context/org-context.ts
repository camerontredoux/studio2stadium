import { createContext } from "react";

import type { OrgMemberType, RosterType } from "@/lib/access";

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
  hasFeature: (key: string) => boolean;
}

export const OrgContext = createContext<OrgContextValue | null>(null);
