import {
  ChalkboardTeacherIcon,
  ClipboardTextIcon,
  GearIcon,
  QrCodeIcon,
  SquaresFourIcon,
  UsersIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";

import { rosterQueries } from "@/features/org/api/roster-queries";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { useOrg } from "@/features/org/context/use-org";

export type AdminNavPath =
  | "/o/$orgSlug/admin"
  | "/o/$orgSlug/admin/dancers"
  | "/o/$orgSlug/admin/coaches"
  | "/o/$orgSlug/admin/check-in"
  | "/o/$orgSlug/admin/uploads"
  | "/o/$orgSlug/admin/settings";

export interface AdminNavItem {
  id: string;
  label: string;
  icon: PhosphorIcon;
  to: AdminNavPath;
  /** The section label shown above this item in the sidebar. */
  section?: "Rosters" | "Admin";
  count?: number;
  current: boolean;
  dock?: false;
}

/**
 * The admin area's destinations, shared by the sidebar and the phone dock.
 * Requests, Callbacks and the Video library are dashboard widgets now; their
 * pages still exist but leave the nav. Check-in shows only with the
 * `check_in` feature, and stays out of the five-item phone dock.
 */
export function useAdminNav(): AdminNavItem[] {
  const { org, hasFeature } = useOrg();
  const { selectedEvent } = useAdminEvent();
  const pathname = useLocation({ select: (location) => location.pathname });
  const eventId = selectedEvent?.id ?? "";

  const dancerStats = useQuery({
    ...rosterQueries.stats(org.slug, eventId, "dancer"),
    enabled: !!selectedEvent,
  });
  const coachStats = useQuery({
    ...rosterQueries.stats(org.slug, eventId, "coach"),
    enabled: !!selectedEvent,
  });

  const base = `/o/${org.slug}/admin`;
  const path = pathname.replace(/\/$/, "");
  const at = (suffix: string) =>
    suffix === "" ? path === base : path.startsWith(`${base}${suffix}`);

  return [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: SquaresFourIcon,
      to: "/o/$orgSlug/admin",
      current: at(""),
    },
    {
      id: "dancers",
      label: "Dancers",
      icon: UsersIcon,
      to: "/o/$orgSlug/admin/dancers",
      section: "Rosters",
      count: dancerStats.data?.total,
      current: at("/dancers"),
    },
    {
      id: "coaches",
      label: "Coaches",
      icon: ChalkboardTeacherIcon,
      to: "/o/$orgSlug/admin/coaches",
      section: "Rosters",
      count: coachStats.data?.total,
      current: at("/coaches"),
    },
    // The dock already holds five items, so Check-in is sidebar-only.
    ...(hasFeature("check_in")
      ? [
          {
            id: "check-in",
            label: "Check-in",
            icon: QrCodeIcon,
            to: "/o/$orgSlug/admin/check-in" as const,
            section: "Rosters" as const,
            current: at("/check-in"),
            dock: false as const,
          },
        ]
      : []),
    {
      id: "audit",
      label: "Audit log",
      icon: ClipboardTextIcon,
      to: "/o/$orgSlug/admin/uploads",
      section: "Admin",
      current: at("/uploads"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: GearIcon,
      to: "/o/$orgSlug/admin/settings",
      section: "Admin",
      current: at("/settings"),
    },
  ];
}
