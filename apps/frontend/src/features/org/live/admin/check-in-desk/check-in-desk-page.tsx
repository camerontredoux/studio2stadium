import { useCallback, useRef, useState } from "react";

import { Panel } from "@/components/event/panel";
import { toastManager } from "@/components/ui/toast-manager";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import { useAdminCheckInToggle } from "@/features/org/api/check-in-queries";
import type { RosterEntry } from "@/features/org/api/roster-queries";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { useOrg } from "@/features/org/context/use-org";
import { useEventPhase } from "@/features/org/hooks/use-event-phase";
import { SubpageHeader } from "@/features/org/live/shared/event-header";
import { ShellPage } from "@/features/org/live/shared/shell-slots";

import { type DeskFlash, DancersPanel } from "./dancers-panel";
import { dancerName } from "./desk-list";
import { ScanPassPanel } from "./scan-pass-panel";
import { useDeskData } from "./use-desk-data";

/** The full-page check-in desk at /o/$orgSlug/admin/check-in. */
export function CheckInDeskPage({ orgSlug }: { orgSlug: string }) {
  const { selectedEvent } = useAdminEvent();
  const { hasFeature } = useOrg();

  if (!selectedEvent) {
    return (
      <ShellPage header={<DeskHeader event={null} />}>
        <DeskNotice>
          No event yet. Create an event to check dancers in.
        </DeskNotice>
      </ShellPage>
    );
  }

  if (!hasFeature("check_in")) {
    return (
      <ShellPage header={<DeskHeader event={selectedEvent} />}>
        <DeskNotice>Check-in isn’t turned on for this organization.</DeskNotice>
      </ShellPage>
    );
  }

  return <CheckInDesk orgSlug={orgSlug} event={selectedEvent} />;
}

function CheckInDesk({ orgSlug, event }: { orgSlug: string; event: OrgEvent }) {
  const desk = useDeskData(orgSlug, event.id);
  const phase = useEventPhase(event);
  const toggle = useAdminCheckInToggle();
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [flash, setFlash] = useState<DeskFlash>(null);
  const flashCount = useRef(0);

  const flashRow = useCallback((rosterId: string) => {
    flashCount.current += 1;
    setFlash({ id: rosterId, n: flashCount.current });
  }, []);

  const onToggle = (entry: RosterEntry) => {
    if (pendingIds.has(entry.id)) return;
    const currentlyCheckedIn = entry.checkedInAt != null;
    const name = dancerName(entry);
    setPendingIds((ids) => new Set(ids).add(entry.id));
    flashRow(entry.id);
    toggle.mutate(
      {
        slug: orgSlug,
        eventId: event.id,
        rosterId: entry.id,
        currentlyCheckedIn,
      },
      {
        onError: () => {
          toastManager.add({
            title: currentlyCheckedIn
              ? `Couldn’t undo the check-in for ${name}`
              : `Couldn’t check in ${name}`,
            type: "error",
          });
        },
        onSettled: () => {
          setPendingIds((ids) => {
            const next = new Set(ids);
            next.delete(entry.id);
            return next;
          });
        },
      },
    );
  };

  const startTime = desk.status?.eventStartTime?.slice(0, 5);
  const scanNote =
    !phase.hasStarted && startTime
      ? `Event starts ${startTime}${desk.status?.timezone ? ` · ${desk.status.timezone}` : ""}`
      : undefined;

  return (
    <ShellPage
      header={
        <DeskHeader
          event={event}
          tally={
            <p
              aria-live="polite"
              aria-atomic="true"
              className="flex items-baseline gap-(--space-6) whitespace-nowrap"
            >
              <span className="text-fg bp-phone:text-[22px] text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                {desk.checkedIn}
              </span>
              <span className="text-fg-3 font-mono text-[14px] tabular-nums">
                /{desk.total}
              </span>
              <span className="type-body text-fg-3">checked in</span>
            </p>
          }
        />
      }
    >
      {/* Full width with the usual 8px panel gap, like the other admin pages. */}
      <div className="bp-phone:grid-cols-[minmax(0,1fr)] grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-(--space-8)">
        <ScanPassPanel
          slug={orgSlug}
          eventId={event.id}
          onScanned={flashRow}
          note={scanNote}
        />
        <DancersPanel
          eventId={event.id}
          dancers={desk.dancers}
          total={desk.total}
          checkedIn={desk.checkedIn}
          notYet={desk.notYet}
          isLoading={desk.isLoading}
          isError={desk.isError}
          flash={flash}
          pendingIds={pendingIds}
          onToggle={onToggle}
        />
      </div>
    </ShellPage>
  );
}

/** The desk's sub-page header: "Event name /", the live badge, "Check-in" and the tally. */
function DeskHeader({
  event,
  tally,
}: {
  event: OrgEvent | null;
  tally?: React.ReactNode;
}) {
  return (
    <SubpageHeader
      event={event}
      title="Check-in"
      dashboardTo="/o/$orgSlug/admin"
      showStatus
      actions={tally}
    />
  );
}

function DeskNotice({ children }: { children: React.ReactNode }) {
  return (
    <Panel>
      <p className="type-body text-fg-3 px-(--space-14) py-[28px] text-center">
        {children}
      </p>
    </Panel>
  );
}
