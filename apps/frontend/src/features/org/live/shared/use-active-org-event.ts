import { useQuery } from "@tanstack/react-query";
import { useContext } from "react";

import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";
import { AdminEventContext } from "@/features/org/context/admin-event-context";
import type { MyRoster } from "@/features/org/context/org-context";
import { useOrg } from "@/features/org/context/use-org";
import { dashboardRoster } from "@/features/org/lib/dashboard-roster";

import {
  ActiveEventScopeContext,
  type EventArea,
} from "./active-event-scope-context";

export interface ActiveOrgEvent {
  area: EventArea;
  /** The Org Event this view shows, or null when there is none. */
  event: OrgEvent | null;
  /** The org's active (live) Org Event. */
  activeEvent: OrgEvent | null;
  /** The viewer's Roster Entry for `event` (coach and dancer areas). */
  roster: MyRoster | null;
  /** Dancer area: the dancer's Roster Entries, one per Org Event, for the switcher. */
  rosters: MyRoster[];
  /** Pick another Org Event (admin: any event; dancer: one they're rostered on). */
  selectEvent: (eventId: string) => void;
  isLoading: boolean;
}

/**
 * The Org Event a dashboard view shows, resolved the same way everywhere:
 * admin → the event picked in the sidebar switcher (`useAdminEvent`);
 * coach → the coach's Roster Entry event, else the active event (as the old
 * coach event-info page did); dancer → the chosen roster event, else the
 * default roster (`dashboardRoster`), else for admins the active event.
 */
export function useActiveOrgEvent(): ActiveOrgEvent {
  const scope = useContext(ActiveEventScopeContext);
  const adminEvent = useContext(AdminEventContext);
  const { org, isAdmin, myRoster, myRosters } = useOrg();
  const area: EventArea = scope?.area ?? (adminEvent ? "admin" : "coach");

  const eventsQuery = useQuery({
    ...adminQueries.events(org.slug),
    enabled: area !== "admin",
  });

  if (area === "admin" && adminEvent) {
    return {
      area,
      event: adminEvent.selectedEvent,
      activeEvent: adminEvent.activeEvent,
      roster: null,
      rosters: [],
      selectEvent: adminEvent.selectEvent,
      isLoading: false,
    };
  }

  const events = eventsQuery.data;
  const activeEvent = events?.find((event) => event.isActive) ?? null;

  if (area === "dancer") {
    const rosters = myRosters.filter((roster) => roster.type === "dancer");
    const defaultRoster = dashboardRoster(rosters, {
      isAdmin,
      myRoster,
      activeEventId: activeEvent?.id,
    });
    const roster =
      rosters.find((entry) => entry.eventId === scope?.dancerEventId) ??
      defaultRoster;
    const rosterEvent =
      events?.find((event) => event.id === roster?.eventId) ?? null;
    return {
      area,
      event: rosterEvent ?? (isAdmin ? activeEvent : null),
      activeEvent,
      roster,
      rosters,
      selectEvent: (eventId) => scope?.setDancerEventId(eventId),
      isLoading: eventsQuery.isLoading,
    };
  }

  const roster = dashboardRoster(myRosters, {
    isAdmin,
    myRoster,
    activeEventId: activeEvent?.id,
  });
  const rosterEvent =
    events?.find((event) => event.id === roster?.eventId) ?? null;
  return {
    area,
    event: rosterEvent ?? activeEvent,
    activeEvent,
    roster,
    rosters: [],
    selectEvent: () => {},
    isLoading: eventsQuery.isLoading,
  };
}
