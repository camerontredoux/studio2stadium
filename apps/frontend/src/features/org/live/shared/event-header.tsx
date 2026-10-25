import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { LiveBadge } from "@/components/event/live-badge";
import { ShellHeader } from "@/components/event/shell";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import { useOrg } from "@/features/org/context/use-org";

import { useEventDayInfo } from "./use-event-time";

type EventDashboardHeaderProps = {
  event: OrgEvent;
  /** The page's buttons, at the right. */
  actions?: ReactNode;
};

/**
 * The dashboard header: the event name and the badge with "Day N/M" on event days ("Live"
 * inside the daily hours, "Today" or "Paused" outside them). Above 1000px the rail carries the status, so the header
 * shows it only at 1000px and under.
 */
export function EventDashboardHeader({
  event,
  actions,
}: EventDashboardHeaderProps) {
  const info = useEventDayInfo(event);
  return (
    <ShellHeader
      title={event.name}
      status={
        info?.dayTag && info.day !== null ? (
          <LiveBadge
            label={info.dayTag}
            live={info.isLive}
            day={info.day}
            days={info.days}
          />
        ) : undefined
      }
      actions={actions}
    />
  );
}

type SubpageHeaderProps = {
  /** The selected event; without one the crumb is left out. */
  event: OrgEvent | null;
  /** The page title. */
  title: ReactNode;
  /** The dashboard's route path, e.g. "/o/$orgSlug/admin". */
  dashboardTo: string;
  /** The page's buttons, at the right. */
  actions?: ReactNode;
  /** Show the live badge beside the title at every width (pages without the rail). */
  showStatus?: boolean;
};

/** A sub-page header: "Event name /" linking back to the dashboard, then the page title. */
export function SubpageHeader({
  event,
  title,
  dashboardTo,
  actions,
  showStatus = false,
}: SubpageHeaderProps) {
  const { org } = useOrg();
  const info = useEventDayInfo(event);
  const status =
    showStatus && info?.dayTag && info.day !== null ? (
      <LiveBadge
        label={info.dayTag}
        live={info.isLive}
        day={info.day}
        days={info.days}
      />
    ) : undefined;

  return (
    <ShellHeader
      title={title}
      crumb={
        event
          ? {
              label: event.name,
              render: (
                // The prop is any route path; the router can't check a runtime string.
                <Link to={dashboardTo as "/"} params={{ orgSlug: org.slug }} />
              ),
            }
          : undefined
      }
      status={status}
      statusAlways={showStatus}
      actions={actions}
    />
  );
}
