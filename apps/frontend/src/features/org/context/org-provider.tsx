import { useEffect, useMemo, type ReactNode } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { orgQueries } from "@/features/org/api/queries";
import { queries as sessionQueries } from "@/lib/session";
import {
  OrgContext,
  type OrgContextValue,
  type OrgMembership,
  type MyRoster,
} from "./org-context";
import { grantsOrgAdmin } from "@/lib/access";
import { hasOrgFeature } from "@/features/org/lib/entitlement";

const EMPTY_ROSTERS: MyRoster[] = [];

export function OrgProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const { data: session } = useQuery(sessionQueries.session());
  const { data } = useSuspenseQuery(orgQueries.org(slug));

  const features = (data.features ?? {}) as Record<string, boolean>;
  const activeEventCapabilities = data.activeEventCapabilities ?? null;
  const membership =
    (data as { membership?: OrgMembership | null }).membership ?? null;
  const myRoster = (data as { myRoster?: MyRoster | null }).myRoster ?? null;
  const myRosters =
    (data as { myRosters?: MyRoster[] }).myRosters ?? EMPTY_ROSTERS;

  const value = useMemo<OrgContextValue>(
    () => ({
      org: {
        id: data.id,
        slug: data.slug,
        name: data.name,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        accentColor: data.accentColor,
      },
      features,
      settings: (data.settings ?? {}) as Record<string, unknown>,
      membership,
      myRoster,
      myRosters,
      isAdmin: grantsOrgAdmin(membership) || session?.role === "admin",
      // Capabilities come from the active Org Event, org-wide configuration
      // from the Org — see `hasOrgFeature`.
      hasFeature: (key) =>
        hasOrgFeature({ features, activeEventCapabilities }, key),
    }),
    [
      data,
      features,
      activeEventCapabilities,
      membership,
      myRoster,
      myRosters,
      session?.role,
    ],
  );

  useEffect(() => {
    const root = document.documentElement;
    if (data.primaryColor)
      root.style.setProperty("--org-primary", data.primaryColor);
    if (data.accentColor)
      root.style.setProperty("--org-accent", data.accentColor);
    return () => {
      root.style.removeProperty("--org-primary");
      root.style.removeProperty("--org-accent");
    };
  }, [data.primaryColor, data.accentColor]);

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}
