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
import { InactiveEventPrompt } from "@/features/org/components/inactive-event-prompt";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { useOrg } from "@/features/org/context/use-org";
import { useEventPhase } from "@/features/org/hooks/use-event-phase";
import {
  useAdminCommandListener,
  useAdminCommands,
} from "@/features/org/hooks/use-admin-commands";
import { needsActivationPrompt } from "@/features/org/lib/event-activation";
import { CheckInWidget } from "@/features/org/live/check-in/check-in-widget";
import { EventDashboardHeader } from "@/features/org/live/shared/event-header";
import {
  EventDetailsBar,
  EventRail,
} from "@/features/org/live/shared/event-rail";
import { ScheduleWidget } from "@/features/org/live/shared/schedule-widget";
import { ShellPage } from "@/features/org/live/shared/shell-slots";
import { VideosWidget } from "@/features/org/live/shared/videos-widget";
import { BUY_ANOTHER_EVENT_MESSAGE, canCreateOrgEvent } from "@/lib/event-tiers";
import { useSession } from "@/lib/session";

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
  const { activeEvent } = useAdminEvent();
  const { dispatch } = useAdminCommands();
  const phase = useEventPhase(event);
  const beforeStart = !phase.hasStarted;
  const claims = useQuery(rosterClaimQueries.pending(orgSlug));
  const requests = (claims.data?.data ?? []).filter(
    (claim) => claim.status === "pending",
  );
  const hasRequests = requests.length > 0;
  // A widget the org's features leave out is not shown at all. Schedule
  // leads; Requests (only while there are open requests) comes last.
  const showCallbacks = hasFeature("callbacks") && event.isActive;
  const showVideos = hasFeature("video_library");
  const showCheckIn = hasFeature("check_in");
  const order = [
    "schedule",
    ...(showCallbacks ? ["callbacks"] : []),
    ...(showVideos ? ["videos"] : []),
    ...(showCheckIn ? ["check-in"] : []),
    ...(hasRequests ? ["requests"] : []),
  ];

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
      {/* A bought event starts inactive (#88), so its buyer lands here first. */}
      {needsActivationPrompt(event, activeEvent) && (
        <InactiveEventPrompt
          orgSlug={orgSlug}
          event={event}
          onReview={() => dispatch({ type: "open-edit-event" })}
        />
      )}
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
        {showCallbacks && <CallbacksWidget orgSlug={orgSlug} />}
        {showVideos && <VideosWidget event={event} canUpload />}
        {showCheckIn && <CheckInWidget slug={orgSlug} eventId={event.id} />}
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

/**
 * The org has no events yet: a short note and "New event". A self-serve or
 * tier-managed Org buys its events, so its Organizers get the note on how to.
 */
function NoEvents({ orgSlug }: { orgSlug: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const org = useOrg();
  const canCreate = canCreateOrgEvent({
    session: useSession(),
    orgSelfServe: org.selfServe,
    orgTierManaged: org.tierManaged,
  });
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
        {canCreate ? (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Icon icon={PlusIcon} />
            New event
          </Button>
        ) : (
          <p className="text-fg-2 m-0 text-[13px] leading-[1.5]">
            {BUY_ANOTHER_EVENT_MESSAGE}
          </p>
        )}
      </Panel>
      <EventFormSheet
        orgSlug={orgSlug}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </ShellPage>
  );
}
