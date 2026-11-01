import type { ReactNode } from "react";

import { ShellHeader } from "@/components/event/shell";
import { AdminCommandPalette } from "@/features/org/components/admin-command-palette";
import { AdminSidebar } from "@/features/org/components/admin-sidebar";
import { OrgEventSwitcher } from "@/features/org/components/org-event-switcher";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { useOrg } from "@/features/org/context/use-org";
import { AdminCommandsProvider } from "@/features/org/hooks/use-admin-commands";
import { ActiveEventScope } from "@/features/org/live/shared/active-event-scope";
import { DancerDialogProvider } from "@/features/org/live/shared/dancer-dialog";
import { AreaShellFrame } from "@/features/org/live/shared/shell-slots";
import { EventPhoneDock } from "@/features/org/live/shared/sidebar-nav";

import { useAdminNav } from "./admin-nav";

/**
 * The admin area frame: sidebar (event switcher, nav, View as), phone brand
 * row and dock, the command palette, and the shared dancer dialog. Mount it
 * inside `AdminEventProvider`; pages set their header and rail with
 * `ShellPage`.
 */
export function AdminAreaShell({ children }: { children: ReactNode }) {
  const { org } = useOrg();
  const { selectedEvent } = useAdminEvent();
  const items = useAdminNav();

  return (
    <AdminCommandsProvider>
      <ActiveEventScope area="admin">
        <DancerDialogProvider viewer="admin" eventId={selectedEvent?.id}>
          <AreaShellFrame
            sidebar={<AdminSidebar />}
            phoneBrand={<OrgEventSwitcher orgSlug={org.slug} />}
            fallbackHeader={
              <ShellHeader title={selectedEvent?.name ?? "No event selected"} />
            }
            dock={<EventPhoneDock items={items} />}
          >
            {children}
          </AreaShellFrame>
          <AdminCommandPalette />
        </DancerDialogProvider>
      </ActiveEventScope>
    </AdminCommandsProvider>
  );
}
