import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { Fragment } from "react";

import { Icon } from "@/components/event/icon";
import {
  PhoneDock,
  ShellSidebarGroup,
  ShellSidebarGroupLabel,
  ShellSidebarMenu,
  ShellSidebarMenuBadge,
  ShellSidebarMenuButton,
  ShellSidebarMenuItem,
} from "@/components/event/shell";
import { useOrg } from "@/features/org/context/use-org";

export interface EventNavItem {
  id: string;
  label: string;
  icon: PhosphorIcon;
  /** A route path under `/o/$orgSlug`, e.g. "/o/$orgSlug/admin/dancers". */
  to: string;
  /** Section label shown above the first item of each section. */
  section?: string;
  /** Roster size shown at the right. */
  count?: number;
  current: boolean;
  /** Leave this item out of the phone dock (it holds at most five). */
  dock?: false;
}

/**
 * The sidebar nav list: 32px items with a 16px icon, counts at the right and
 * section labels ("Rosters", "Admin") between groups.
 */
export function SidebarNavList({ items }: { items: EventNavItem[] }) {
  const { org } = useOrg();
  const groups: { section?: string; items: EventNavItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.section === item.section) last.items.push(item);
    else groups.push({ section: item.section, items: [item] });
  }

  return (
    <>
      {groups.map((group, index) => (
        <Fragment key={group.section ?? `group-${index}`}>
          <ShellSidebarGroup>
            {group.section && (
              <ShellSidebarGroupLabel>{group.section}</ShellSidebarGroupLabel>
            )}
            <ShellSidebarMenu>
              {group.items.map((item) => (
                <ShellSidebarMenuItem key={item.id}>
                  <ShellSidebarMenuButton
                    isActive={item.current}
                    tooltip={item.label}
                    render={
                      <Link
                        to={item.to}
                        params={{ orgSlug: org.slug }}
                        aria-current={item.current ? "page" : undefined}
                      />
                    }
                  >
                    <Icon icon={item.icon} size="md" />
                    <span>{item.label}</span>
                  </ShellSidebarMenuButton>
                  {item.count != null && (
                    <ShellSidebarMenuBadge>{item.count}</ShellSidebarMenuBadge>
                  )}
                </ShellSidebarMenuItem>
              ))}
            </ShellSidebarMenu>
          </ShellSidebarGroup>
        </Fragment>
      ))}
    </>
  );
}

/** The phone dock (≤800px) built from the same items as the sidebar. */
export function EventPhoneDock({ items }: { items: EventNavItem[] }) {
  const { org } = useOrg();
  return (
    <PhoneDock
      items={items
        .filter((item) => item.dock !== false)
        .slice(0, 5)
        .map((item) => ({
          id: item.id,
          label: item.label,
          icon: item.icon,
          current: item.current,
          render: <Link to={item.to} params={{ orgSlug: org.slug }} />,
        }))}
    />
  );
}
