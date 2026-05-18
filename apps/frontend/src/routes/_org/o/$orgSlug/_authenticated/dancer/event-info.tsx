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
  formatDateRange,
  scheduleFileUrl,
} from "@/features/org/components/dashboard-shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  FileTextIcon,
  MapPinIcon,
} from "lucide-react";

export const Route = createFileRoute(
  "/_org/o/$orgSlug/_authenticated/dancer/event-info",
)({
  component: DancerEventInfo,
});

function DancerEventInfo() {
  const { orgSlug } = Route.useParams();
  const { data: events } = useQuery(adminQueries.events(orgSlug));
  const activeEvent = events?.find((e) => e.isActive) ?? null;

  if (!activeEvent) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        No active event.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
      <EventHeader orgSlug={orgSlug} event={activeEvent} />
      <CheckInCard orgSlug={orgSlug} eventId={activeEvent.id} />
    </div>
  );
}

function EventHeader({
  orgSlug,
  event,
}: {
  orgSlug: string;
  event: OrgEvent;
}) {
  const dateRange = formatDateRange(event.startDate, event.endDate);
  const fileUrl = event.schedulePdfUrl
    ? scheduleFileUrl(orgSlug, event.id)
    : null;

  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-xl font-semibold leading-tight md:text-2xl">
        {event.name}
      </h1>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <CalendarIcon className="size-3.5 shrink-0" />
          {dateRange}
        </span>
        {event.venueName && (
          <span className="flex items-center gap-1.5">
            <MapPinIcon className="size-3.5 shrink-0" />
            {event.venueName}
          </span>
        )}
        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary flex items-center gap-1.5 hover:underline"
          >
            <FileTextIcon className="size-3.5 shrink-0" />
            Schedule
          </a>
        )}
      </div>
    </div>
  );
}

function CheckInCard({
  orgSlug,
  eventId,
}: {
  orgSlug: string;
  eventId: string;
}) {
  const { data: status, isLoading } = useQuery({
    ...checkInQueries.status(orgSlug, eventId),
    refetchInterval: 30_000,
  });
  const checkIn = useDancerCheckIn(orgSlug, eventId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="text-muted-foreground size-5" />
      </div>
    );
  }

  if (!status) return null;

  return <CheckInCardContent status={status} checkIn={checkIn} />;
}

function CheckInCardContent({
  status,
  checkIn,
}: {
  status: CheckInStatus;
  checkIn: ReturnType<typeof useDancerCheckIn>;
}) {
  // If no startTime/timezone configured, render nothing
  if (!status.eventStartTime || !status.timezone) return null;

  // Already checked in
  if (status.checkedInAt) {
    const checkedInTime = new Date(status.checkedInAt).toLocaleTimeString(
      "en-US",
      { hour: "numeric", minute: "2-digit", hour12: true },
    );
    return (
      <div className="border-success/30 bg-success/5 flex items-start gap-3 rounded-lg border p-4">
        <CheckCircle2Icon className="text-success mt-0.5 size-5 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <p className="text-success text-sm font-semibold">Checked in</p>
          <p className="text-muted-foreground text-xs">
            You checked in at {checkedInTime}
          </p>
        </div>
      </div>
    );
  }

  // Can check in
  if (status.canCheckIn) {
    return (
      <div className="border-border bg-card flex items-start gap-3 rounded-lg border p-4">
        <ClockIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold">Check-in is open</p>
            <p className="text-muted-foreground text-xs">
              Confirm your attendance at this event.
            </p>
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

  // Not yet open
  const opensAt = new Date(status.eventStartTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="border-border bg-card flex items-start gap-3 rounded-lg border p-4">
      <ClockIcon className="text-muted-foreground mt-0.5 size-5 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold">Check-in not yet open</p>
        <p className="text-muted-foreground text-xs">
          Opens at {opensAt} {status.timezone}
        </p>
      </div>
      <Button size="sm" className="ml-auto w-fit" disabled>
        Check in
      </Button>
    </div>
  );
}
