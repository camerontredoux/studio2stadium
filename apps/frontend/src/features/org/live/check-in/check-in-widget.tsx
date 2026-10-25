import { ScanIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import * as React from "react";

import { Button } from "@/components/event/button";
import { Icon } from "@/components/event/icon";
import { Label } from "@/components/event/label";
import { ProgressBar } from "@/components/event/progress-bar";
import { useWidgetBoardSlot } from "@/components/event/shell/widget-board-context";
import { Tile } from "@/components/event/tile";
import { Viewfinder } from "@/components/event/viewfinder";
import { rosterQueries } from "@/features/org/api/roster-queries";
import { useOrg } from "@/features/org/context/use-org";
import { formatCheckInTime } from "@/features/org/live/check-in/check-in-code";
import { useEventTimeZone } from "@/features/org/live/shared/use-event-time-zone";
import {
  InlineScanner,
  type ScannedDancer,
  type ScanOutcome,
} from "@/features/org/live/check-in/inline-scanner";

type CheckInWidgetPartProps = { slug: string; eventId: string };

/** Check-in has no realtime broadcast, so the counts poll. */
const POLL_MS = 10_000;

function useCheckInStats(slug: string, eventId: string) {
  const { data } = useQuery({
    ...rosterQueries.stats(slug, eventId, "dancer"),
    refetchInterval: POLL_MS,
  });
  const total = data?.total ?? 0;
  const checkedIn = data?.checkedIn ?? 0;
  return {
    loaded: data !== undefined,
    total,
    checkedIn,
    pct: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
  };
}

/**
 * The most recent check-in. The roster list sorts `checkedInAt desc` with the
 * not-checked-in rows first, so with one row per page the newest check-in is
 * at page (total - checkedIn).
 */
function useLastCheckedIn(slug: string, eventId: string) {
  const { total, checkedIn } = useCheckInStats(slug, eventId);
  const { data } = useQuery({
    ...rosterQueries.list(slug, eventId, {
      type: "dancer",
      sortBy: "checkedInAt",
      sortDir: "desc",
      limit: 1,
      page: total - checkedIn,
    }),
    enabled: checkedIn > 0,
  });
  const row = checkedIn > 0 ? data?.data[0] : undefined;
  return row?.checkedInAt
    ? {
        id: row.id,
        bib: row.bibNumber,
        firstName: row.firstName,
        lastName: row.lastName,
        checkedInAt: row.checkedInAt,
      }
    : undefined;
}

/** Peek: a progress bar of dancers checked in. Never touches the camera. */
export function CheckInWidgetPeek({ slug, eventId }: CheckInWidgetPartProps) {
  const { pct } = useCheckInStats(slug, eventId);
  return (
    <>
      <ProgressBar
        value={pct}
        label="Dancers checked in"
        showValue={false}
        className="flex-none"
      />
    </>
  );
}

type CheckInWidgetOpenProps = CheckInWidgetPartProps & {
  /** True only while the widget is open: the camera runs exactly then. */
  active: boolean;
};

/** Open: the inline scanner (camera on while open) and the last check-in, which phones leave out to give the camera the room. */
export function CheckInWidgetOpen({
  slug,
  eventId,
  active,
}: CheckInWidgetOpenProps) {
  const { loaded, checkedIn, total } = useCheckInStats(slug, eventId);
  const timeZone = useEventTimeZone();
  const serverLast = useLastCheckedIn(slug, eventId);
  const [scanned, setScanned] = React.useState<ScannedDancer>();
  const [scanAnyway, setScanAnyway] = React.useState(false);
  // Keep the scanner up while its result shows, so the last check-in's
  // "Checked in" isn't cut short by the switch to "Everyone is checked in".
  const [scannerBusy, setScannerBusy] = React.useState(false);

  const onResult = React.useCallback((outcome: ScanOutcome) => {
    if (outcome.kind === "checked-in") setScanned(outcome.roster);
    if (outcome.kind === "undone")
      setScanned((s) => (s?.id === outcome.roster.id ? undefined : s));
  }, []);

  const last =
    scanned?.checkedInAt &&
    (!serverLast || scanned.checkedInAt >= serverLast.checkedInAt)
      ? scanned
      : serverLast;
  const everyone = loaded && total > 0 && checkedIn >= total;
  const done = everyone && !scanAnyway && !scannerBusy;

  return (
    // A size container: the viewfinder grows to the height left after the
    // padding, buttons and Last checked in card (phones hide the card), so
    // the three sit with even gaps instead of the camera taking spare space.
    <div className="@container-[size] flex h-full justify-center">
      <div className="bp-phone:gap-(--space-8) bp-phone:p-(--space-12) box-border flex min-h-0 w-full flex-col items-center justify-center gap-(--space-12) p-(--space-16)">
        {done ? (
          <>
            <Viewfinder state="done" />
            <Button onClick={() => setScanAnyway(true)}>
              <Icon icon={ScanIcon} />
              Scan anyway
            </Button>
          </>
        ) : (
          <InlineScanner
            slug={slug}
            eventId={eventId}
            active={active}
            onResult={onResult}
            onBusyChange={setScannerBusy}
            viewfinderClassName="max-w-[min(400px,calc(100cqh-152px))] bp-phone:max-w-[min(400px,calc(100cqh-64px))]"
          />
        )}
        <div
          aria-live="polite"
          data-testid="check-in-last"
          className="border-line bg-bg-100 bp-phone:hidden box-border flex w-full max-w-[280px] flex-col gap-(--space-8) rounded-(--radius-10) border px-(--space-12) py-(--space-10)"
        >
          <Label>Last checked in</Label>
          {last?.checkedInAt ? (
            <div className="flex min-w-0 items-baseline gap-(--space-10)">
              <span className="text-fg flex-none font-mono text-[20px] leading-none font-medium tabular-nums">
                {last.bib ?? "[No bib]"}
              </span>
              <span className="type-body-strong text-fg min-w-0 flex-1 truncate">
                {`${last.firstName} ${last.lastName}`.trim()}
              </span>
              <span className="type-meta text-fg-3 flex-none">
                {formatCheckInTime(last.checkedInAt, timeZone)}
              </span>
            </div>
          ) : (
            <span className="type-body text-fg-3">No one checked in yet</span>
          )}
        </div>
      </div>
    </div>
  );
}

type CheckInWidgetProps = CheckInWidgetPartProps & {
  /** Must appear in the surrounding `WidgetBoard`'s `order`. Default "check-in". */
  id?: string;
};

/**
 * The whole Check-in widget for a `WidgetBoard`: peek, strip and open layers,
 * with the camera running only while it is open. Without the `check_in`
 * feature it shows as a locked tile.
 */
export function CheckInWidget({
  slug,
  eventId,
  id = "check-in",
}: CheckInWidgetProps) {
  const { hasFeature } = useOrg();
  const slot = useWidgetBoardSlot(id);
  const enabled = hasFeature("check_in");

  return (
    <Tile
      id={id}
      label="Check-in"
      icon={ScanIcon}
      disabled={!enabled}
      disabledText="Not included in this event"
      peek={
        enabled ? (
          <CheckInWidgetPeek slug={slug} eventId={eventId} />
        ) : undefined
      }
      fullPage={
        <Link to="/o/$orgSlug/admin/check-in" params={{ orgSlug: slug }} />
      }
    >
      {enabled && (
        <CheckInWidgetOpen
          slug={slug}
          eventId={eventId}
          active={slot?.state === "open"}
        />
      )}
    </Tile>
  );
}
