import {
  ChalkboardTeacherIcon,
  QuestionIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";

import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import type { EventNavItem } from "@/features/org/live/shared/sidebar-nav";
import { useActiveOrgEvent } from "@/features/org/live/shared/use-active-org-event";

/** The dancer area's destinations, shared by the sidebar and the phone dock. */
export function useDancerNav(): EventNavItem[] {
  const { org } = useOrg();
  const { event } = useActiveOrgEvent();
  const pathname = useLocation({ select: (location) => location.pathname });
  // The first page carries the total, and Top choices on the dashboard shares it.
  const schools = useInfiniteQuery({
    ...scoutingQueries.schoolPages(org.slug, event?.id),
    enabled: !!event,
    retry: false,
  });
  const base = `/o/${org.slug}/dancer`;
  const path = pathname.replace(/\/$/, "");

  return [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: SquaresFourIcon,
      to: "/o/$orgSlug/dancer/event-info",
      current: path === base || path.startsWith(`${base}/event-info`),
    },
    {
      id: "coaches",
      label: "Coaches",
      icon: ChalkboardTeacherIcon,
      to: "/o/$orgSlug/dancer/coaches",
      count: schools.data?.pages[0]?.total,
      current: path.startsWith(`${base}/coaches`),
    },
    {
      id: "faq",
      label: "FAQ",
      icon: QuestionIcon,
      to: "/o/$orgSlug/dancer/faq",
      current: path.startsWith(`${base}/faq`),
    },
  ];
}
