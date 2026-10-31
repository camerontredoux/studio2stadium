import {
  ShellSidebar,
  ShellSidebarContent,
  ShellSidebarFooter,
  ShellSidebarHeader,
} from "@/components/event/shell";
import { OrgEventSwitcher } from "@/features/org/components/org-event-switcher";
import { ViewSwitcher } from "@/features/org/components/view-switcher";
import { useOrg } from "@/features/org/context/use-org";
import { useAdminNav } from "@/features/org/live/admin/admin-nav";
import { SidebarNavList } from "@/features/org/live/shared/sidebar-nav";

/**
 * The admin area sidebar: the event switcher (org brand), Dashboard, the
 * Rosters (Dancers, Coaches with counts) and Admin (Audit log, Settings)
 * sections, and the signed-in person with the "View as" menu.
 */
export function AdminSidebar() {
  const { org } = useOrg();
  const items = useAdminNav();

  return (
    <ShellSidebar>
      <ShellSidebarHeader>
        <OrgEventSwitcher orgSlug={org.slug} />
      </ShellSidebarHeader>
      <ShellSidebarContent>
        <SidebarNavList items={items} />
      </ShellSidebarContent>
      <ShellSidebarFooter>
        <ViewSwitcher />
      </ShellSidebarFooter>
    </ShellSidebar>
  );
}
