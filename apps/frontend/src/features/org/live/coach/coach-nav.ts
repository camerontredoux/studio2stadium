import {
  QuestionIcon,
  SquaresFourIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";

import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import type { EventNavItem } from "@/features/org/live/shared/sidebar-nav";

/** The coach area's destinations, shared by the sidebar and the phone dock. */
export function useCoachNav(): EventNavItem[] {
  const { org } = useOrg();
  const pathname = useLocation({ select: (location) => location.pathname });
  const dancers = useQuery(scoutingQueries.dancers(org.slug));
  const base = `/o/${org.slug}/coach`;
  const path = pathname.replace(/\/$/, "");

  return [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: SquaresFourIcon,
      to: "/o/$orgSlug/coach/event-info",
      current: path === base || path.startsWith(`${base}/event-info`),
    },
    {
      id: "dancers",
      label: "Dancers",
      icon: UsersIcon,
      to: "/o/$orgSlug/coach/dancers",
      count: dancers.data?.length,
      current: path.startsWith(`${base}/dancers`),
    },
    {
      id: "faq",
      label: "FAQ",
      icon: QuestionIcon,
      to: "/o/$orgSlug/coach/faq",
      current: path.startsWith(`${base}/faq`),
    },
  ];
}
