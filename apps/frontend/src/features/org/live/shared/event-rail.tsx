import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";

import {
  DateRangePicker,
  type DateRange,
} from "@/components/event/date-range-picker";
import { DayProgress } from "@/components/event/day-progress";
import { DetailList, DetailListItem } from "@/components/event/detail-list";
import { Panel, PanelHead } from "@/components/event/panel";
import { RailSection, ShellRail } from "@/components/event/shell";
import {
  TimeRangePicker,
  type TimeRange,
} from "@/components/event/time-range-picker";
import { toastManager } from "@/components/ui/toast-manager";
import {
  invalidateOrgEvents,
  type OrgEvent,
} from "@/features/org/api/admin-queries";
import { localDateFromYmd } from "@/features/org/lib/event-clock";
import { useOrg } from "@/features/org/context/use-org";
import { $api, type ApiSchemas } from "@/lib/api/client";

import { CollapsibleBar } from "./collapsible-bar";
import {
  eventYearLabel,
  formatRailDateRange,
  TIME_PLACEHOLDER,
  normalizeTime,
  timeZoneAbbr,
  type EventDayInfo,
} from "./event-time";
import { useEventDayInfo } from "./use-event-time";

type EventRailProps = {
  event: OrgEvent;
  /** Admin: the dates and times are pickers that save to the event. */
  editable?: boolean;
};

/**
 * The dashboard's right rail: where the event is in time (live day progress, or when it
 * starts or ended) and its details. Renders the `ShellRail` itself; pass it as
 * `EventShell`'s `rail`. Hidden at 1000px and under, where `EventDetailsBar` shows the
 * details instead.
 */
export function EventRail({ event, editable = false }: EventRailProps) {
  const info = useEventDayInfo(event);

  return (
    <ShellRail className="bp-rail:hidden">
      {info && (
        <RailSection event>
          <EventStatus info={info} />
        </RailSection>
      )}
      <RailSection>
        <PanelHead label="Details" />
        <EventDetails event={event} editable={editable} />
      </RailSection>
    </ShellRail>
  );
}

/**
 * The rail's details at 1000px and under, where the rail is hidden: a closed bar summing
 * up the dates and venue that opens to the full details. Put it first in the main column.
 * The header shows the event status at these widths.
 */
export function EventDetailsBar({ event, editable = false }: EventRailProps) {
  return (
    <Panel aria-label="Event details" className="bp-rail:flex hidden">
      <CollapsibleBar
        label="Details"
        summary={
          <>
            {formatRailDateRange(event)}
            {event.venueName && (
              <>
                {" · "}
                <span className="type-caption">{event.venueName}</span>
              </>
            )}
          </>
        }
      >
        <div className="border-line-soft border-t">
          <EventDetails event={event} editable={editable} />
        </div>
      </CollapsibleBar>
    </Panel>
  );
}

function EventDetails({ event, editable }: Required<EventRailProps>) {
  const zone = timeZoneAbbr(event);
  return (
    <DetailList>
      <DetailListItem
        label={`Dates · ${eventYearLabel(event)}`}
        value={editable ? undefined : formatRailDateRange(event)}
      >
        {editable ? <EditableDates key={event.id} event={event} /> : undefined}
      </DetailListItem>
      <DetailListItem
        label={zone ? `Hours (each day) · ${zone}` : "Hours (each day)"}
        mono
        value={
          editable ? undefined : (
            <TimeRangeText
              start={normalizeTime(event.startTime)}
              end={normalizeTime(event.endTime)}
            />
          )
        }
      >
        {editable ? <EditableTimes key={event.id} event={event} /> : undefined}
      </DetailListItem>
      <DetailListItem
        label="Location"
        value={event.venueName ?? "[Venue name]"}
        sub={event.venueAddress ?? "[Street address, City, State]"}
      />
      <DetailListItem label="Contact">
        {event.contactEmail ? (
          <a
            href={`mailto:${event.contactEmail}`}
            className="type-body text-fg s2s-focus min-w-0 truncate rounded-(--radius-3) no-underline hover:underline"
          >
            {event.contactEmail}
          </a>
        ) : (
          <span className="type-body text-fg">[Contact email]</span>
        )}
      </DetailListItem>
    </DetailList>
  );
}

/** The read-only hours: "10:00 → 16:00", an unset start or end in placeholder colour. */
function TimeRangeText({
  start,
  end,
}: {
  start: string | null;
  end: string | null;
}) {
  return (
    <>
      {start ?? <span className="text-fg-3">{TIME_PLACEHOLDER.start}</span>}
      {" → "}
      {end ?? <span className="text-fg-3">{TIME_PLACEHOLDER.end}</span>}
    </>
  );
}

/**
 * On an event day: DayProgress, tagged "Live" inside the daily hours and "Today" or
 * "Paused" outside them. Before or after: what is true, in the same frame.
 */
function EventStatus({ info }: { info: EventDayInfo }) {
  if (info.dayTag && info.day !== null) {
    return (
      <DayProgress
        day={info.day}
        days={info.days}
        pct={info.todayPct}
        labels={info.dayLabels}
        left={info.timeLeftLabel ?? undefined}
        status={info.dayTag}
        live={info.isLive}
      />
    );
  }

  const upcoming = info.phase !== "wrapped";
  const away = info.daysAway ?? 0;
  const awayText = upcoming
    ? away === 1
      ? "Tomorrow"
      : `In ${away} days`
    : away === 1
      ? "Yesterday"
      : `${away} days ago`;
  const [word, ...rest] = (info.statusLine ?? "").split(" ");

  return (
    <div className="flex flex-col gap-(--space-12) p-(--space-14)">
      <div className="flex items-center justify-between">
        <span className="type-label text-fg-2 border-line-control rounded-(--radius-4) border px-(--space-6) py-(--space-2)">
          {upcoming ? "Upcoming" : "Ended"}
        </span>
        <span className="type-data-sm text-fg-2">{awayText}</span>
      </div>
      <p className="m-0 flex min-w-0 items-baseline gap-(--space-8)">
        <span className="text-fg-3 shrink-0 text-[14px] leading-[1.4] font-medium">
          {word}
        </span>
        <span className="type-display-day text-fg truncate">
          {rest.join(" ")}
        </span>
      </p>
    </div>
  );
}

type EventPatchBody = ApiSchemas["OrgsIdEventsIdRequest"];

/** PATCH /orgs/{slug}/events/{id}, as the event form sheet sends it, then refresh the events. */
function useEventPatch(event: OrgEvent) {
  const qc = useQueryClient();
  const { org } = useOrg();
  const mutation = $api.useMutation("patch", "/orgs/{slug}/events/{id}", {
    // Returning the refetch keeps the mutation pending until the new event is in.
    onSuccess: () => invalidateOrgEvents(qc, org.slug),
    onError: (error) => {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : undefined;
      toastManager.add({
        title: "Couldn't update event",
        description: message,
        type: "error",
      });
    },
  });
  return (body: EventPatchBody, onSettled: () => void) =>
    mutation.mutate(
      { params: { path: { slug: org.slug, id: event.id } }, body },
      { onSettled },
    );
}

const toYmd = (date: Date) => format(date, "yyyy-MM-dd");

/** The date chips as a range picker. Saves once both dates are picked. */
function EditableDates({ event }: { event: OrgEvent }) {
  const save = useEventPatch(event);
  const [draft, setDraft] = useState<DateRange | null>(null);
  const value = draft ?? {
    start: localDateFromYmd(event.startDate),
    end: localDateFromYmd(event.endDate),
  };

  const handleChange = (next: DateRange) => {
    if (!next.start || !next.end) {
      setDraft(next);
      return;
    }
    const startDate = toYmd(next.start);
    const endDate = toYmd(next.end);
    if (startDate === event.startDate && endDate === event.endDate) {
      setDraft(null);
      return;
    }
    setDraft(next);
    save({ startDate, endDate }, () => setDraft(null));
  };

  return (
    <DateRangePicker value={value} onChange={handleChange} className="w-full" />
  );
}

/**
 * The daily hours as a time range picker, the same hours on every event day. Each pick
 * saves; picking a start after the end clears the end, as the picker does. When the event
 * has no zone yet, the hours save with the org default zone (the backend's
 * `effectiveTimezone`), never the viewer's browser zone.
 */
function EditableTimes({ event }: { event: OrgEvent }) {
  const save = useEventPatch(event);
  const [draft, setDraft] = useState<TimeRange | null>(null);
  const value = draft ?? {
    start: normalizeTime(event.startTime),
    end: normalizeTime(event.endTime),
  };

  const handleChange = (next: TimeRange) => {
    const start = normalizeTime(next.start);
    // The backend needs a start for an end, and an end after the start.
    const end = start ? normalizeTime(next.end) : null;
    const validEnd = end && start && end > start ? end : null;
    if (!start) {
      setDraft(null);
      return;
    }
    if (
      start === normalizeTime(event.startTime) &&
      validEnd === normalizeTime(event.endTime)
    ) {
      setDraft(null);
      return;
    }
    const timezone = event.timezone ?? event.effectiveTimezone ?? null;
    setDraft({ start, end: validEnd });
    save({ startTime: start, endTime: validEnd, timezone }, () =>
      setDraft(null),
    );
  };

  return (
    <TimeRangePicker
      value={value}
      onChange={handleChange}
      startLabel="Daily start time"
      endLabel="Daily end time"
      startPlaceholder={TIME_PLACEHOLDER.start}
      endPlaceholder={TIME_PLACEHOLDER.end}
      className="w-full"
    />
  );
}
