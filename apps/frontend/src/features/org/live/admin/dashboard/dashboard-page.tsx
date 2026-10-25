import { PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { MenuItem } from "@/components/event/menu";
import { Panel } from "@/components/event/panel";
import { ShellHeader, WidgetBoard } from "@/components/event/shell";
import { SplitButton } from "@/components/event/split-button";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import { rosterClaimQueries } from "@/features/org/api/roster-claim-queries";
import { EventFormSheet } from "@/features/org/components/event-form-sheet";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { useOrg } from "@/features/org/context/use-org";
import { useEventPhase } from "@/features/org/hooks/use-event-phase";
import { useAdminCommandListener } from "@/features/org/hooks/use-admin-commands";
import { CheckInWidget } from "@/features/org/live/check-in/check-in-widget";
import { EventDashboardHeader } from "@/features/org/live/shared/event-header";
import {
  EventDetailsBar,
  EventRail,
} from "@/features/org/live/shared/event-rail";
import { ScheduleWidget } from "@/features/org/live/shared/schedule-widget";
import { ShellPage } from "@/features/org/live/shared/shell-slots";
import { VideosWidget } from "@/features/org/live/shared/videos-widget";

import { CallbacksWidget } from "./callbacks-widget";
import { ChecklistPanel } from "./checklist-panel";
import { DeleteEventDialog } from "./delete-event-dialog";
import { RequestsWidget } from "./requests-widget";
import { RostersPanel } from "./rosters-panel";

/** The admin dashboard at /o/:orgSlug/admin. */
export function AdminDashboardPage({ orgSlug }: { orgSlug: string }) {
  const { events, selectedEvent } = useAdminEvent();

  if (!selectedEvent) {
    return events.length === 0 ? <NoEvents orgSlug={orgSlug} /> : null;
  }
  // Keyed so open widgets, dialogs and drafts reset when the admin switches events.
  return (
    <Dashboard key={selectedEvent.id} orgSlug={orgSlug} event={selectedEvent} />
  );
}

function Dashboard({ orgSlug, event }: { orgSlug: string; event: OrgEvent }) {
  const { hasFeature } = useOrg();
  const phase = useEventPhase(event);
  const beforeStart = !phase.hasStarted;
  const claims = useQuery(rosterClaimQueries.pending(orgSlug));
  const requests = (claims.data?.data ?? []).filter(
    (claim) => claim.status === "pending",
  );
  const hasRequests = requests.length > 0;
  // A widget the org's features leave out shows disabled instead of hiding,
  // and disabled widgets go last. Schedule leads; Requests (only while there
  // are open requests) is the last of the working ones.
  const widgets = [
    { id: "schedule", enabled: true },
    {
      id: "callbacks",
      enabled: hasFeature("callbacks") && event.isActive,
    },
    { id: "videos", enabled: hasFeature("video_library") },
    { id: "check-in", enabled: hasFeature("check_in") },
    ...(hasRequests ? [{ id: "requests", enabled: true }] : []),
  ];
  const order = [
    ...widgets.filter((widget) => widget.enabled),
    ...widgets.filter((widget) => !widget.enabled),
  ].map((widget) => widget.id);

  return (
    <ShellPage
      header={
        <EventDashboardHeader
          event={event}
          actions={<EventActions orgSlug={orgSlug} event={event} />}
        />
      }
      rail={<EventRail event={event} editable />}
    >
      <EventDetailsBar event={event} editable />
      <RostersPanel orgSlug={orgSlug} eventId={event.id} />
      <WidgetBoard order={order} firstRow={4}>
        <ScheduleWidget event={event} mode="admin" />
        {hasRequests && (
          <RequestsWidget
            orgSlug={orgSlug}
            eventId={event.id}
            claims={requests}
          />
        )}
        <CallbacksWidget orgSlug={orgSlug} event={event} />
        <VideosWidget event={event} canUpload />
        <CheckInWidget slug={orgSlug} eventId={event.id} />
      </WidgetBoard>
      {/* Not in the mockup: the old dashboard's checklist, only until the event starts. */}
      {beforeStart && (
        <ChecklistPanel orgSlug={orgSlug} eventId={event.id} phase={phase} />
      )}
    </ShellPage>
  );
}

/** "Edit" opens the event sheet; its caret menu holds "Delete event". */
function EventActions({
  orgSlug,
  event,
}: {
  orgSlug: string;
  event: OrgEvent;
}) {
  const { events, selectEvent } = useAdminEvent();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // The command palette's "Edit event".
  useAdminCommandListener(
    (action) => action.type === "open-edit-event",
    () => setEditOpen(true),
  );

  return (
    <>
      <SplitButton
        label="Edit"
        icon={PencilSimpleIcon}
        ariaLabel="Edit event"
        onClick={() => setEditOpen(true)}
        menuLabel="More event actions"
        menuProps={{ align: "end" }}
      >
        <MenuItem
          icon={TrashIcon}
          variant="danger"
          onClick={() => setDeleteOpen(true)}
        >
          Delete event
        </MenuItem>
      </SplitButton>
      <EventFormSheet
        orgSlug={orgSlug}
        event={event}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteEventDialog
        orgSlug={orgSlug}
        event={event}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          const next =
            events.find((e) => e.id !== event.id && e.isActive) ??
            events.find((e) => e.id !== event.id);
          if (next) selectEvent(next.id);
        }}
      />
    </>
  );
}

/** The org has no events yet: a short note and "New event". */
function NoEvents({ orgSlug }: { orgSlug: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <ShellPage header={<ShellHeader title="Dashboard" />}>
      <Panel className="flex flex-col items-start gap-(--space-12) p-(--space-16)">
        <div className="flex flex-col gap-(--space-4)">
          <h2 className="type-title text-fg m-0 text-[15px] font-semibold">
            Create your first event
          </h2>
          <p className="text-fg-2 m-0 text-[13px] leading-[1.5]">
            Once the event exists you can upload its dancer and coach rosters,
            the schedule and videos.
          </p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Icon icon={PlusIcon} />
          New event
        </Button>
      </Panel>
      <EventFormSheet
        orgSlug={orgSlug}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </ShellPage>
  );
}
