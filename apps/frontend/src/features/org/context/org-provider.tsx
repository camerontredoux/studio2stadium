import { useEffect, useMemo, type ReactNode } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { orgQueries } from "@/features/org/api/queries";
import { useSession } from "@/lib/session";
import {
  OrgContext,
  type OrgContextValue,
  type OrgMembership,
  type MyRoster,
} from "./org-context";

export function OrgProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const session = useSession();
  const { data } = useSuspenseQuery(orgQueries.org(slug));

  const features = (data.features ?? {}) as Record<string, boolean>;
  const membership =
    (data as { membership?: OrgMembership | null }).membership ?? null;
  const myRoster =
    (data as { myRoster?: MyRoster | null }).myRoster ?? null;

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
      isAdmin: membership?.role === "admin" || session.role === "admin",
      hasFeature: (key) => Boolean(features[key]),
    }),
    [data, features, membership, myRoster, session.role],
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
