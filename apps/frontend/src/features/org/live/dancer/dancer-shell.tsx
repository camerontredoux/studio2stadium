import type { ReactNode } from "react";

import { ShellHeader } from "@/components/event/shell";
import {
  DancerSidebar,
  DancerSidebarBrand,
} from "@/features/org/components/dancer-sidebar";
import { PreviewModeBanner } from "@/features/org/components/preview-mode-banner";
import { useOrg } from "@/features/org/context/use-org";
import { ActiveEventScope } from "@/features/org/live/shared/active-event-scope";
import { AreaShellFrame } from "@/features/org/live/shared/shell-slots";
import { EventPhoneDock } from "@/features/org/live/shared/sidebar-nav";
import { useActiveOrgEvent } from "@/features/org/live/shared/use-active-org-event";

import { useDancerNav } from "./dancer-nav";

function DancerFrame({ children }: { children: ReactNode }) {
  const { org } = useOrg();
  const { event } = useActiveOrgEvent();
  const items = useDancerNav();

  return (
    <AreaShellFrame
      sidebar={<DancerSidebar />}
      phoneBrand={<DancerSidebarBrand />}
      fallbackHeader={<ShellHeader title={event?.name ?? org.name} />}
      dock={<EventPhoneDock items={items} />}
    >
      <PreviewModeBanner role="dancer" orgSlug={org.slug} />
      {children}
    </AreaShellFrame>
  );
}

/**
 * The dancer area frame: sidebar (brand or event switcher, Dashboard,
 * Coaches, FAQ, person menu), phone brand row and dock, and the admin preview
 * banner. Pages set their header and rail with `ShellPage`.
 */
export function DancerAreaShell({ children }: { children: ReactNode }) {
  return (
    <ActiveEventScope area="dancer">
      <DancerFrame>{children}</DancerFrame>
    </ActiveEventScope>
  );
}
