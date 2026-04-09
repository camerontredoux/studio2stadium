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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { useOrg } from "@/features/org/context/use-org";
import { useAdminCommands } from "@/features/org/hooks/use-admin-commands";
import { useSession } from "@/lib/session";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import {
  CalendarIcon,
  ChevronDownIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  LogOutIcon,
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
  const session = useSession();
  const { org } = useOrg();
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const location = useLocation();
  const { dispatch } = useAdminCommands();

  const displayName =
    [session.firstName, session.lastName].filter(Boolean).join(" ").trim() ||
    session.username;

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
              <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
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
            <Menu>
              <SidebarMenuButton
                size="lg"
                tooltip={displayName}
                className="data-popup-open:bg-sidebar-accent"
                render={<MenuTrigger />}
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={session.avatar || undefined} />
                  <AvatarFallback className="rounded-lg text-xs">
                    {session.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {session.displayEmail}
                  </span>
                </div>
                <ChevronDownIcon className="text-muted-foreground ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
              <MenuPopup
                side="top"
                align="start"
                className="w-(--anchor-width) min-w-0 max-w-(--anchor-width)"
              >
                <MenuGroup>
                  <MenuItem disabled className="min-h-0 flex-col items-start gap-0.5 py-2">
                    <span className="font-medium">{displayName}</span>
                    <span className="text-muted-foreground text-xs">
                      @{session.username}
                    </span>
                  </MenuItem>
                </MenuGroup>
                <MenuSeparator />
                <MenuItem closeOnClick render={<Link to="/logout" />}>
                  <LogOutIcon />
                  Log out
                </MenuItem>
              </MenuPopup>
            </Menu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
