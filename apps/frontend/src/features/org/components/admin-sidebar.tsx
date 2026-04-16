import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { useSession } from "@/lib/session";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  ChevronDownIcon,
  ClipboardListIcon,
  EyeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MicIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

const dashboardItem = {
  label: "Dashboard",
  icon: LayoutDashboardIcon,
  to: "/$orgSlug/admin" as const,
  exact: true,
};

const navSections = [
  {
    title: "Rosters",
    items: [
      {
        label: "Dancers",
        icon: UsersIcon,
        to: "/$orgSlug/admin/dancers" as const,
      },
      {
        label: "Coaches",
        icon: MicIcon,
        to: "/$orgSlug/admin/coaches" as const,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        label: "Audit Log",
        icon: ClipboardListIcon,
        to: "/$orgSlug/admin/uploads" as const,
      },
      {
        label: "Settings",
        icon: SettingsIcon,
        to: "/$orgSlug/admin/settings" as const,
      },
    ],
  },
];

export function AdminSidebar() {
  const session = useSession();
  const { org, membership } = useOrg();
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const location = useLocation();
  const navigate = useNavigate();
  const DashboardIcon = dashboardItem.icon;

  const displayName =
    [session.firstName, session.lastName].filter(Boolean).join(" ").trim() ||
    session.username;
  const isItemActive = (to: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === `/${orgSlug}/admin`;
    }

    return location.pathname.startsWith(to.replace("$orgSlug", orgSlug));
  };

  const allNavItems = [
    dashboardItem,
    ...navSections.flatMap(
      (section) =>
        section.items as {
          label: string;
          icon: any;
          to: string;
          exact?: boolean;
        }[],
    ),
  ];
  const currentView = location.pathname.includes("/admin")
    ? "Admin"
    : location.pathname.includes("/coach")
      ? "Coach"
      : "Dancer";
  const canSwitchView = membership?.role === "admin";

  function handleSelectView(view: "Admin" | "Coach" | "Dancer") {
    if (view === "Admin") {
      void navigate({ to: "/$orgSlug/admin", params: { orgSlug } });
      return;
    }

    if (view === "Coach") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (navigate as any)({ to: "/$orgSlug/coach", params: { orgSlug } });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void (navigate as any)({ to: "/$orgSlug", params: { orgSlug } });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border h-12 border-b p-0">
        <SidebarMenu className="p-0">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-12 rounded-none px-3 py-0 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
              render={<Link to="/$orgSlug/admin" params={{ orgSlug }} />}
            >
              <div className="hidden size-7 items-center justify-center rounded-md text-xs font-semibold text-white shadow-sm group-data-[collapsible=icon]:flex">
                <span
                  className="flex size-7 items-center justify-center rounded-md"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--org-primary, var(--color-primary)), var(--org-accent, var(--color-primary)))",
                  }}
                >
                  {org.name.charAt(0).toUpperCase()}
                </span>
              </div>
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

      <SidebarContent className="gap-0 p-0">
        <SidebarGroup className="p-0">
          <SidebarGroupContent className="p-0">
            <div className="border-sidebar-border flex flex-col border-b group-data-[collapsible=icon]:hidden">
              <section className="border-sidebar-border bg-sidebar border-b last:border-b-0">
                <SidebarGroupLabel className="text-muted-foreground px-3 pt-2 pb-1 text-[10px] font-semibold tracking-widest uppercase">
                  Overview
                </SidebarGroupLabel>
                <div className="border-sidebar-border border-t">
                  <Link
                    to={dashboardItem.to}
                    params={{ orgSlug }}
                    className={`flex min-h-10 items-center gap-2 border-t-2 px-3 py-2 transition-colors ${
                      isItemActive(dashboardItem.to, dashboardItem.exact)
                        ? "border-primary text-primary bg-sidebar-accent/40"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/20 border-transparent"
                    }`}
                  >
                    <DashboardIcon
                      className={`size-3.5 shrink-0 ${
                        isItemActive(dashboardItem.to, dashboardItem.exact)
                          ? "text-primary/80"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs leading-none font-semibold">
                      {dashboardItem.label}
                    </span>
                  </Link>
                </div>
              </section>

              {navSections.map((section) => (
                <section
                  key={section.title}
                  className="border-sidebar-border bg-sidebar border-b last:border-b-0"
                >
                  <SidebarGroupLabel className="text-muted-foreground px-3 pt-2 pb-1 text-[10px] font-semibold tracking-widest uppercase">
                    {section.title}
                  </SidebarGroupLabel>
                  <div className="border-sidebar-border grid grid-cols-2 border-t">
                    {section.items.map(({ label, icon: Icon, to }) => {
                      const isActive = isItemActive(to);
                      return (
                        <Link
                          key={label}
                          to={to}
                          params={{ orgSlug }}
                          className={`border-sidebar-border flex min-h-10 items-center gap-2 border-t-2 border-r px-3 py-2 transition-colors even:border-r-0 ${
                            isActive
                              ? "border-t-primary text-primary bg-sidebar-accent/40"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/20 border-t-transparent"
                          }`}
                        >
                          <Icon
                            className={`size-3.5 shrink-0 ${
                              isActive
                                ? "text-primary/80"
                                : "text-muted-foreground"
                            }`}
                          />
                          <span className="text-xs leading-none font-semibold">
                            {label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="border-sidebar-border hidden h-full flex-col border-t group-data-[collapsible=icon]:flex">
              {allNavItems.map(({ label, icon: Icon, to, exact }) => {
                const isActive = isItemActive(to, exact);
                return (
                  <Link
                    key={label}
                    to={to}
                    params={{ orgSlug }}
                    title={label}
                    aria-label={label}
                    className={`border-sidebar-border flex h-12 items-center justify-center border-t-2 border-b transition-colors ${
                      isActive
                        ? "border-t-primary bg-sidebar-accent/40 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/20 border-t-transparent"
                    }`}
                  >
                    <Icon
                      className={`size-4 shrink-0 ${
                        isActive ? "text-primary/80" : "text-muted-foreground"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-0">
        <SidebarMenu className="gap-0 p-0">
          <SidebarMenuItem>
            <Menu>
              <SidebarMenuButton
                size="lg"
                tooltip={displayName}
                className="data-popup-open:bg-sidebar-accent border-sidebar-border hover:bg-sidebar-accent/20 rounded-none border-t-2 border-t-transparent px-3 py-3 group-data-[collapsible=icon]:h-12! group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-none group-data-[collapsible=icon]:p-0!"
                render={<MenuTrigger />}
              >
                <Avatar className="size-8">
                  <AvatarImage src={session.avatar || undefined} />
                  <AvatarFallback className="text-xs">
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
                className="w-64 max-w-80 min-w-64"
              >
                <MenuGroup>
                  <MenuItem
                    disabled
                    className="min-h-0 flex-col items-start gap-0.5 py-2"
                  >
                    <span className="font-medium">{displayName}</span>
                    <span className="text-muted-foreground text-xs">
                      @{session.username}
                    </span>
                  </MenuItem>
                </MenuGroup>
                {canSwitchView ? (
                  <>
                    <MenuSeparator />
                    <MenuGroup>
                      <MenuItem disabled>
                        <EyeIcon />
                        Viewing as: {currentView}
                      </MenuItem>
                      {(["Admin", "Coach", "Dancer"] as const).map((view) => (
                        <MenuItem
                          key={view}
                          onClick={() => handleSelectView(view)}
                        >
                          {view}
                        </MenuItem>
                      ))}
                    </MenuGroup>
                  </>
                ) : null}
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
