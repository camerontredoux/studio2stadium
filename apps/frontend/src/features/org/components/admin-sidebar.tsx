import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Kbd } from "@/components/ui/kbd";
import { useOrg } from "@/features/org/context/use-org";
import { useAdminCommands } from "@/features/org/hooks/use-admin-commands";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import {
  CalendarIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    to: "/$orgSlug/admin" as const,
    exact: true,
  },
  {
    label: "Event",
    icon: CalendarIcon,
    to: "/$orgSlug/admin" as const,
    action: "edit-event" as const,
  },
  {
    label: "Rosters",
    icon: UsersIcon,
    to: "/$orgSlug/admin/rosters" as const,
  },
  {
    label: "Uploads",
    icon: HistoryIcon,
    to: "/$orgSlug/admin/uploads" as const,
  },
  {
    label: "Settings",
    icon: SettingsIcon,
    to: "/$orgSlug/admin/settings" as const,
  },
];

export function AdminSidebar() {
  const { org } = useOrg();
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const location = useLocation();
  const { openPalette, dispatch } = useAdminCommands();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to="/$orgSlug/admin" params={{ orgSlug }} />}
            >
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="size-8 rounded object-contain"
                />
              ) : (
                <div
                  className="flex size-8 items-center justify-center rounded text-sm font-semibold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--org-primary, var(--color-primary)), var(--org-accent, var(--color-primary)))",
                  }}
                >
                  {org.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-semibold">{org.name}</span>
                <span className="text-muted-foreground truncate text-[10px] font-medium tracking-wide uppercase">
                  Admin
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ label, icon: Icon, to, action, exact }) => {
                const isActive = exact
                  ? location.pathname === `/${orgSlug}/admin`
                  : location.pathname.startsWith(
                      to.replace("$orgSlug", orgSlug),
                    );
                if (action === "edit-event") {
                  return (
                    <SidebarMenuItem key={label}>
                      <SidebarMenuButton
                        tooltip={label}
                        onClick={() => dispatch({ type: "open-edit-event" })}
                      >
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
                return (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton
                      tooltip={label}
                      isActive={isActive}
                      render={<Link to={to} params={{ orgSlug }} />}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Command palette"
              onClick={openPalette}
              className="justify-between"
            >
              <div className="flex items-center gap-2">
                <SearchIcon />
                <span>Commands</span>
              </div>
              <Kbd className="ml-auto text-[10px]">⌘K</Kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
