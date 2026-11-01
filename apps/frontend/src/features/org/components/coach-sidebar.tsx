import {
  ShellSidebar,
  ShellSidebarContent,
  ShellSidebarFooter,
  ShellSidebarHeader,
} from "@/components/event/shell";
import { ViewSwitcher } from "@/features/org/components/view-switcher";
import { useOrg } from "@/features/org/context/use-org";
import { useCoachNav } from "@/features/org/live/coach/coach-nav";
import { OrgSidebarBrand } from "@/features/org/live/shared/sidebar-brand";
import { SidebarNavList } from "@/features/org/live/shared/sidebar-nav";

/**
 * The coach area sidebar: the org brand, Dashboard, Dancers (count) and FAQ,
 * and the signed-in person ("Coach · Org" with the "View as" menu for admins).
 */
export function CoachSidebar() {
  const { org } = useOrg();
  const items = useCoachNav();

  return (
    <ShellSidebar>
      <ShellSidebarHeader>
        <OrgSidebarBrand dashboardTo="/o/$orgSlug/coach/event-info" />
      </ShellSidebarHeader>
      <ShellSidebarContent>
        <SidebarNavList items={items} />
      </ShellSidebarContent>
      <ShellSidebarFooter>
        <ViewSwitcher sub={`Coach · ${org.name}`} />
      </ShellSidebarFooter>
    </ShellSidebar>
  );
}
