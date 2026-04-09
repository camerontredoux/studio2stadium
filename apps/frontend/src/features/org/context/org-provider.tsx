import { createContext, useEffect, useMemo, type ReactNode } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { orgQueries } from "@/features/org/api/queries";

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

export function OrgProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const { data } = useSuspenseQuery(orgQueries.org(slug));

  const features = (data.features ?? {}) as Record<string, boolean>;
  const membership =
    ((data as { membership?: OrgMembership | null }).membership ?? null);

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
      isAdmin: membership?.role === "admin",
      hasFeature: (key) => Boolean(features[key]),
    }),
    [data, features, membership],
  );

  useEffect(() => {
    const root = document.documentElement;
    if (data.primaryColor) root.style.setProperty("--org-primary", data.primaryColor);
    if (data.accentColor) root.style.setProperty("--org-accent", data.accentColor);
    return () => {
      root.style.removeProperty("--org-primary");
      root.style.removeProperty("--org-accent");
    };
  }, [data.primaryColor, data.accentColor]);

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}
