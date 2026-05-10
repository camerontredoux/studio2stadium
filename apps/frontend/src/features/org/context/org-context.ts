import { createContext } from "react";

export interface OrgMembership {
  role: "admin" | "member";
  type: "coach" | "dancer";
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
  isAdmin: boolean;
  hasFeature: (key: string) => boolean;
}

export const OrgContext = createContext<OrgContextValue | null>(null);
