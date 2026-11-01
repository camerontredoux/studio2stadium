import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ShellSidebar,
  ShellSidebarContent,
  ShellSidebarFooter,
  ShellSidebarHeader,
} from "@/components/event/shell";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerEventSwitcher } from "@/features/org/components/dancer-event-switcher";
import { ViewSwitcher } from "@/features/org/components/view-switcher";
import { useOrg } from "@/features/org/context/use-org";
import { useTransmitSubscription } from "@/features/org/hooks/use-transmit";
import { useDancerNav } from "@/features/org/live/dancer/dancer-nav";
import { OrgSidebarBrand } from "@/features/org/live/shared/sidebar-brand";
import { SidebarNavList } from "@/features/org/live/shared/sidebar-nav";
import { useActiveOrgEvent } from "@/features/org/live/shared/use-active-org-event";

/**
 * The dancer area brand: the event switcher when the dancer is on several
 * Org Events' rosters, else the org brand.
 */
export function DancerSidebarBrand() {
  const { rosters, roster, selectEvent } = useActiveOrgEvent();
  if (rosters.length > 1) {
    return (
      <DancerEventSwitcher
        rosters={rosters}
        value={roster?.eventId ?? ""}
        onValueChange={selectEvent}
      />
    );
  }
  return <OrgSidebarBrand dashboardTo="/o/$orgSlug/dancer/event-info" />;
}

/**
 * The dancer area sidebar: brand (or event switcher), Dashboard, Coaches
 * (count) and FAQ, and the signed-in person ("Dancer · bib", "View as" for
 * admins). Keeps the dancer's callbacks fresh while the area is open.
 */
export function DancerSidebar() {
  const { org, hasFeature } = useOrg();
  const { roster } = useActiveOrgEvent();
  const items = useDancerNav();
  const qc = useQueryClient();
  const orgSlug = org.slug;

  // Gate on the event the Dancer is viewing, not the Org's active one (#110).
  const callbacksOn = hasFeature("callbacks", roster?.eventId);

  useQuery({
    ...scoutingQueries.dancerCallbacks(orgSlug),
    enabled: callbacksOn,
  });

  useTransmitSubscription(
    callbacksOn ? `orgs/${orgSlug}/showcases` : null,
    () => {
      // Every event's callbacks: a key carrying `eventId: undefined` would
      // not match the event-scoped queries the callbacks pages use.
      void qc.invalidateQueries({
        queryKey: [
          "get",
          "/orgs/{slug}/dancer/callbacks",
          { params: { path: { slug: orgSlug } } },
        ],
      });
    },
  );

  return (
    <ShellSidebar>
      <ShellSidebarHeader>
        <DancerSidebarBrand />
      </ShellSidebarHeader>
      <ShellSidebarContent>
        <SidebarNavList items={items} />
      </ShellSidebarContent>
      <ShellSidebarFooter>
        <ViewSwitcher sub={roster ? `Dancer · ${org.name}` : undefined} />
      </ShellSidebarFooter>
    </ShellSidebar>
  );
}
