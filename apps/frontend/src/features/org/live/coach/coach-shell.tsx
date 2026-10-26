import type { ReactNode } from "react";

import { ShellHeader } from "@/components/event/shell";
import { CoachSidebar } from "@/features/org/components/coach-sidebar";
import { ViewAsIndicator } from "@/features/org/components/view-as-indicator";
import { useOrg } from "@/features/org/context/use-org";
import { ActiveEventScope } from "@/features/org/live/shared/active-event-scope";
import { DancerDialogProvider } from "@/features/org/live/shared/dancer-dialog";
import { AreaShellFrame } from "@/features/org/live/shared/shell-slots";
import { OrgSidebarBrand } from "@/features/org/live/shared/sidebar-brand";
import { EventPhoneDock } from "@/features/org/live/shared/sidebar-nav";
import { useActiveOrgEvent } from "@/features/org/live/shared/use-active-org-event";

import { useCoachNav } from "./coach-nav";

function CoachFrame({ children }: { children: ReactNode }) {
  const { org } = useOrg();
  const { event } = useActiveOrgEvent();
  const items = useCoachNav();

  return (
    <DancerDialogProvider viewer="coach" eventId={event?.id}>
      <AreaShellFrame
        sidebar={<CoachSidebar />}
        phoneBrand={
          <OrgSidebarBrand dashboardTo="/o/$orgSlug/coach/event-info" />
        }
        viewAs={(placement) => (
          <ViewAsIndicator
            role="coach"
            orgSlug={org.slug}
            placement={placement}
          />
        )}
        fallbackHeader={<ShellHeader title={event?.name ?? org.name} />}
        dock={<EventPhoneDock items={items} />}
      >
        {children}
      </AreaShellFrame>
    </DancerDialogProvider>
  );
}

/**
 * The coach area frame: sidebar (brand, Dashboard, Dancers, FAQ, person
 * menu), phone brand row and dock, the admin view-as indicator, and the shared
 * dancer dialog (coach view). Pages set their header and rail with `ShellPage`.
 */
export function CoachAreaShell({ children }: { children: ReactNode }) {
  return (
    <ActiveEventScope area="coach">
      <CoachFrame>{children}</CoachFrame>
    </ActiveEventScope>
  );
}
