import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClockIcon,
  ExpandIcon,
  PlayCircleIcon,
  SchoolIcon,
  UserCheckIcon,
} from "lucide-react";

import { EventScheduleDialog } from "@/components/event-schedule-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast-manager";
import { adminQueries, type OrgEvent } from "@/features/org/api/admin-queries";
import {
  checkInQueries,
  useDancerCheckIn,
  type CheckInStatus,
} from "@/features/org/api/check-in-queries";
import {
  AccentDot,
  DashboardHeader,
  formatDateRange,
  scheduleFileUrl,
  SidebarDetailsSection,
  SidebarPhaseSection,
  StatCell,
} from "@/features/org/components/dashboard-shared";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { useEventPhase } from "@/features/org/hooks/use-event-phase";
import { DancerEventSwitcher } from "@/features/org/components/dancer-event-switcher";
import { EventAccessBanner } from "@/features/org/components/event-access-banner";
import type { MyRoster } from "@/features/org/context/org-context";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/event-info",
)({
  component: DancerEventInfo,
});

function DancerEventInfo() {
  const { orgSlug } = Route.useParams();
  const { isAdmin, myRoster, myRosters } = useOrg();
  const dancerRosters = myRosters.filter((roster) => roster.type === "dancer");
  const defaultRoster =
    dancerRosters.find((roster) => roster.id === myRoster?.id) ??
    dancerRosters[0] ??
    null;
  const { data: events } = useQuery(adminQueries.events(orgSlug));
  const activeEvent = events?.find((e) => e.isActive) ?? null;
  const [selectedEventId, setSelectedEventId] = useState(
    defaultRoster?.eventId ?? "",
  );
  const selectedRoster =
    dancerRosters.find((roster) => roster.eventId === selectedEventId) ??
    defaultRoster;
  const rosterEvent =
    events?.find((event) => event.id === selectedRoster?.eventId) ?? null;
  const event = rosterEvent ?? (isAdmin ? activeEvent : null);

  if (!event) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        No registered event.
      </div>
    );
  }

  return (
    <DancerDashboard
      orgSlug={orgSlug}
      event={event}
      roster={selectedRoster}
      rosters={dancerRosters}
      onEventChange={setSelectedEventId}
    />
  );
}

function DancerDashboard({
  orgSlug,
  event,
  roster,
  rosters,
  onEventChange,
}: {
  orgSlug: string;
  event: OrgEvent;
  roster: MyRoster | null;
  rosters: MyRoster[];
  onEventChange: (eventId: string) => void;
}) {
  const { hasFeature } = useOrg();
  const phase = useEventPhase(event.startDate, event.endDate);
  const dateRange = formatDateRange(event.startDate, event.endDate);

  const checkInEnabled = hasFeature("check_in");
  const { data: status, isLoading: statusLoading } = useQuery({
    ...checkInQueries.status(orgSlug, event.id),
    refetchInterval: 30_000,
    enabled: checkInEnabled,
  });
  const checkIn = useDancerCheckIn(orgSlug, event.id);

  const callbacksEnabled = hasFeature("callbacks");
  const { data: dancerCallbacks } = useQuery({
    ...scoutingQueries.dancerCallbacks(orgSlug, event.id),
    enabled: callbacksEnabled,
  });

  const isCheckedIn = !!status?.checkedInAt;
  const hasCallbacks =
    Array.isArray(dancerCallbacks) && dancerCallbacks.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto xl:flex-row xl:overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col xl:min-h-0 xl:overflow-hidden">
        <DashboardHeader
          name={event.name}
          phase={phase}
          dateRange={dateRange}
          actions={
            rosters.length > 1 ? (
              <DancerEventSwitcher
                rosters={rosters}
                value={event.id}
                onValueChange={onEventChange}
              />
            ) : undefined
          }
        />

        {roster && (!event.isActive || !roster.hasStarted) && (
          <EventAccessBanner eventName={event.name} startDate={event.startDate}>
            Check-in opens one hour before the event starts. Event-only features
            will appear here as the organizer publishes them.
          </EventAccessBanner>
        )}

        <section
          aria-label="Status"
          className="border-border flex shrink-0 items-stretch border-y"
        >
          {checkInEnabled && (
            <StatCell
              label="Check-in"
              value={isCheckedIn ? "Done" : "Pending"}
              accent={isCheckedIn ? "green" : "amber"}
            />
          )}
          <StatCell label="Phase" value={phase.label} accent="blue" />
        </section>

        <section
          aria-label="Dashboard panels"
          className={`grid flex-1 grid-cols-1 content-start gap-3 p-4 lg:grid-cols-2 xl:min-h-0 ${
            event.schedulePdfUrl ? "lg:grid-rows-[auto_1fr]" : ""
          }`}
        >
          {checkInEnabled && (
            <CheckInPanel
              status={status ?? null}
              isLoading={statusLoading}
              checkIn={checkIn}
              eventStartDate={event.startDate}
            />
          )}
          <QuickNavPanel
            orgSlug={orgSlug}
            eventId={event.id}
            showCallbacks={hasCallbacks}
            hasFeature={hasFeature}
          />
          {event.schedulePdfUrl && (
            <div className="flex h-full min-h-0 flex-col lg:col-span-2">
              <SchedulePreviewPanel
                orgSlug={orgSlug}
                eventId={event.id}
                scheduleKey={event.schedulePdfUrl}
              />
            </div>
          )}
        </section>
      </div>

      <aside className="border-border flex w-full shrink-0 flex-col border-t xl:w-[320px] xl:overflow-x-hidden xl:overflow-y-auto xl:border-t-0 xl:border-l">
        <SidebarPhaseSection phase={phase} />
        <SidebarDetailsSection orgSlug={orgSlug} event={event} />
      </aside>
    </div>
  );
}

function CheckInPanel({
  status,
  isLoading,
  checkIn,
  eventStartDate,
}: {
  status: CheckInStatus | null;
  isLoading: boolean;
  checkIn: ReturnType<typeof useDancerCheckIn>;
  eventStartDate: string;
}) {
  return (
    <div className="border-border flex max-h-72 min-h-0 w-full flex-col overflow-y-auto rounded-md border">
      <div className="border-border bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
            <AccentDot accent="green" />
            Check-in
          </span>
          <span className="text-muted-foreground text-[11px] 2xl:text-xs">
            Confirm your attendance
          </span>
        </div>
      </div>
      <div className="flex flex-1 items-start p-3">
        {isLoading ? (
          <div className="flex w-full items-center justify-center py-4">
            <Spinner className="text-muted-foreground size-5" />
          </div>
        ) : !status ? (
          <p className="text-muted-foreground text-xs">
            Check-in is not available.
          </p>
        ) : (
          <CheckInContent
            status={status}
            checkIn={checkIn}
            eventStartDate={eventStartDate}
          />
        )}
      </div>
    </div>
  );
}

function CheckInContent({
  status,
  checkIn,
  eventStartDate,
}: {
  status: CheckInStatus;
  checkIn: ReturnType<typeof useDancerCheckIn>;
  eventStartDate: string;
}) {
  if (status.checkedInAt) {
    const checkedInTime = new Date(status.checkedInAt).toLocaleTimeString(
      "en-US",
      { hour: "numeric", minute: "2-digit", hour12: true },
    );
    return (
      <div className="flex items-start gap-3">
        <span className="flex size-7 items-center justify-center rounded-md border border-emerald-500/20 bg-emerald-500/10">
          <CheckCircle2Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium 2xl:text-sm">
            You're checked in
          </span>
          <span className="text-muted-foreground text-[11px] 2xl:text-xs">
            Checked in at {checkedInTime}
          </span>
        </div>
      </div>
    );
  }

  if (status.canCheckIn) {
    return (
      <div className="flex w-full items-start gap-3">
        <span className="flex size-7 items-center justify-center rounded-md border border-blue-500/20 bg-blue-500/10">
          <UserCheckIcon className="size-3.5 text-blue-600 dark:text-blue-400" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium 2xl:text-sm">
              Check-in is open
            </span>
            <span className="text-muted-foreground text-[11px] 2xl:text-xs">
              Confirm your attendance at this event.
            </span>
          </div>
          <Button
            size="sm"
            className="w-fit"
            disabled={checkIn.isPending}
            onClick={() =>
              checkIn.mutate(undefined, {
                onError: () =>
                  toastManager.add({
                    title: "Check-in failed. Please try again.",
                    type: "error",
                  }),
                onSuccess: () =>
                  toastManager.add({
                    title: "You're checked in!",
                    type: "success",
                  }),
              })
            }
          >
            {checkIn.isPending ? "Checking in…" : "Check in"}
          </Button>
        </div>
      </div>
    );
  }

  const opensAt =
    status.eventStartTime && status.timezone
      ? formatCheckInOpenTime(
          eventStartDate,
          status.eventStartTime,
          status.timezone,
        )
      : null;

  return (
    <div className="flex items-start gap-3">
      <span className="flex size-7 items-center justify-center rounded-md border border-amber-500/20 bg-amber-500/10">
        <ClockIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium 2xl:text-sm">
          Check-in not yet open
        </span>
        <span className="text-muted-foreground text-[11px] 2xl:text-xs">
          {opensAt ? `Opens at ${opensAt}` : "Opens on event day"}
        </span>
      </div>
    </div>
  );
}

function formatCheckInOpenTime(
  startDate: string,
  startTime: string,
  timezone: string,
): string | null {
  const [year, month, day] = startDate.split("-").map(Number);
  const [hour, minute] = startTime.split(":").map(Number);
  const eventWallTime = Date.UTC(year, month - 1, day, hour, minute);

  try {
    const partsFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const getOffset = (instant: number) => {
      const parts = Object.fromEntries(
        partsFormatter
          .formatToParts(new Date(instant))
          .filter((part) => part.type !== "literal")
          .map((part) => [part.type, part.value]),
      );
      const zonedWallTime = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second),
      );
      return zonedWallTime - instant;
    };

    let eventInstant = eventWallTime - getOffset(eventWallTime);
    eventInstant = eventWallTime - getOffset(eventInstant);

    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).format(new Date(eventInstant - 60 * 60 * 1000));
  } catch {
    return null;
  }
}

function QuickNavPanel({
  orgSlug,
  eventId,
  showCallbacks,
  hasFeature,
}: {
  orgSlug: string;
  eventId: string;
  showCallbacks: boolean;
  hasFeature: (key: string) => boolean;
}) {
  const navItems = [
    ...(hasFeature("video_library")
      ? [
          {
            icon: PlayCircleIcon,
            label: "Video Library",
            to: "/o/$orgSlug/dancer/video-library",
            description: "Watch and upload videos",
            iconClass:
              "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
          },
        ]
      : []),
    ...(hasFeature("school_selections")
      ? [
          {
            icon: SchoolIcon,
            label: "Browse Schools",
            to: "/o/$orgSlug/dancer/schools",
            description: "Explore attending programs",
            iconClass:
              "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
          },
        ]
      : []),
    ...(showCallbacks
      ? [
          {
            icon: UserCheckIcon,
            label: "Callbacks",
            to: "/o/$orgSlug/dancer/callbacks",
            description: "View your callback selections",
            iconClass:
              "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          },
        ]
      : []),
  ];

  return (
    <div className="border-border flex max-h-72 min-h-0 w-full flex-col overflow-y-auto rounded-md border">
      <div className="border-border bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
            <AccentDot accent="purple" />
            Explore
          </span>
          <span className="text-muted-foreground text-[11px] 2xl:text-xs">
            Jump to key sections
          </span>
        </div>
      </div>
      <ul className="divide-border divide-y">
        {navItems.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              params={{ orgSlug } as any}
              search={{ eventId }}
              className="hover:bg-muted/40 group flex items-center gap-3 px-3 py-2.5 transition-colors"
            >
              <span
                className={`flex size-7 items-center justify-center rounded-md border ${item.iconClass}`}
              >
                <item.icon className="size-3.5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-xs font-medium 2xl:text-sm">
                  {item.label}
                </span>
                <span className="text-muted-foreground text-[11px] 2xl:text-xs">
                  {item.description}
                </span>
              </div>
              <ArrowRightIcon className="text-muted-foreground size-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SchedulePreviewPanel({
  orgSlug,
  eventId,
  scheduleKey,
}: {
  orgSlug: string;
  eventId: string;
  scheduleKey: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const fileUrl = scheduleFileUrl(orgSlug, eventId);
  const isPdf = scheduleKey.endsWith(".pdf");

  return (
    <>
      <div className="border-border flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-md border">
        <div className="border-border bg-muted/40 flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2">
          <div className="flex min-w-0 flex-col">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase 2xl:text-xs">
              <AccentDot accent="cyan" />
              Event Schedule
            </span>
            <span className="text-muted-foreground text-[11px] 2xl:text-xs">
              Uploaded by organizer
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-5"
            onClick={() => setExpanded(true)}
            aria-label="Expand schedule"
          >
            <ExpandIcon className="size-3" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-clip">
          {isPdf ? (
            <iframe
              src={fileUrl}
              className="h-full w-full"
              title="Event schedule"
            />
          ) : (
            <img
              src={fileUrl}
              alt="Event schedule"
              className="h-full w-full object-contain"
            />
          )}
        </div>
      </div>

      <EventScheduleDialog
        open={expanded}
        onOpenChange={setExpanded}
        fileUrl={fileUrl}
      />
    </>
  );
}
