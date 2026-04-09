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
import { useOrg } from "@/features/org/context/use-org";
import { ViewSwitcher } from "@/features/org/components/view-switcher";
import { Link, useLocation, useParams } from "@tanstack/react-router";
import { HeartIcon, SearchIcon, TrophyIcon } from "lucide-react";

const navItems = [
  { label: "Search", icon: SearchIcon, to: "/$orgSlug/coach/dancers" },
  { label: "Favorites", icon: HeartIcon, to: "/$orgSlug/coach/favorites" },
  { label: "Rankings", icon: TrophyIcon, to: "/$orgSlug/coach/rankings" },
];

export function CoachSidebar() {
  const { org } = useOrg();
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Link to={"/$orgSlug/coach" as any} params={{ orgSlug } as any} />
              }
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
                  Coach
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
              {navItems.map(({ label, icon: Icon, to }) => {
                const isActive = location.pathname.startsWith(
                  to.replace("$orgSlug", orgSlug),
                );
                return (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton
                      tooltip={label}
                      isActive={isActive}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      render={<Link to={to} params={{ orgSlug } as any} />}
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
          <ViewSwitcher />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
