import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  QrCodeIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/event/button";
import { CheckInPass } from "@/components/event/check-in-pass";
import {
  Dialog,
  DialogBody,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { Icon } from "@/components/event/icon";
import { Panel, PanelHead, PanelSubHead } from "@/components/event/panel";
import { ProgressBar } from "@/components/event/progress-bar";
import { Search } from "@/components/event/search";
import { Segmented } from "@/components/event/segmented";
import { cn } from "@/components/utils/cn";
import { checkInQueries } from "@/features/org/api/check-in-queries";
import type { RosterEntry } from "@/features/org/api/roster-queries";
import { useOrg } from "@/features/org/context/use-org";
import { DancerBib } from "@/features/org/live/shared/dancer-bib";

import {
  type DeskFilter,
  checkInPercent,
  dancerName,
  emptyMessage,
  formatCheckInTime,
  groupDesk,
} from "./desk-list";
import { useEventTimeZone } from "@/features/org/live/shared/use-event-time-zone";

/** The last row checked in or scanned; a new `n` replays the flash. */
export type DeskFlash = { id: string; n: number } | null;

export interface DancersPanelProps {
  eventId: string;
  dancers: RosterEntry[];
  total: number;
  checkedIn: number;
  notYet: number;
  isLoading: boolean;
  isError: boolean;
  flash: DeskFlash;
  /** Roster Entry ids with a check-in or undo in flight. */
  pendingIds: ReadonlySet<string>;
  /** Only ever called to change state: check in a dancer who isn't, undo one who is. */
  onToggle: (entry: RosterEntry) => void;
}

export function DancersPanel({
  eventId,
  dancers,
  total,
  checkedIn,
  notYet,
  isLoading,
  isError,
  flash,
  pendingIds,
  onToggle,
}: DancersPanelProps) {
  const [filter, setFilter] = useState<DeskFilter>("all");
  const [query, setQuery] = useState("");
  const percent = checkInPercent(checkedIn, total);

  const groups = useMemo(
    () => groupDesk(dancers, { filter, query }),
    [dancers, filter, query],
  );

  return (
    <Panel aria-label="Dancers">
      <PanelHead
        label="Dancers"
        actions={
          <ProgressBar
            value={percent}
            label="Dancers checked in"
            className="w-[180px] pr-(--space-6)"
          />
        }
      />
      <div className="border-line bp-phone:px-(--space-10) flex flex-wrap items-center gap-(--space-8) border-b px-(--space-14) py-(--space-10)">
        <Search
          placeholder="Search name or bib"
          aria-label="Search dancers by name or bib"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="bp-phone:flex-[1_1_180px] ms-0 flex-[1_1_180px]"
        />
        <Segmented
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: total },
            { value: "out", label: "Not yet", count: notYet },
            { value: "in", label: "Checked in", count: checkedIn },
          ]}
        />
      </div>

      {isLoading ? (
        <DeskEmpty>Loading dancers</DeskEmpty>
      ) : isError ? (
        <DeskEmpty>
          Couldn’t load the roster. It retries every 10 seconds.
        </DeskEmpty>
      ) : groups.length === 0 ? (
        <DeskEmpty>
          {emptyMessage({ filter, query, total: dancers.length })}
        </DeskEmpty>
      ) : (
        groups.map((group) => (
          <DeskGroupList
            key={group.key}
            label={group.label}
            rows={group.rows}
            eventId={eventId}
            flash={flash}
            pendingIds={pendingIds}
            onToggle={onToggle}
          />
        ))
      )}
    </Panel>
  );
}

function DeskEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="type-body text-fg-3 px-(--space-14) py-[28px] text-center">
      {children}
    </p>
  );
}

function DeskGroupList({
  label,
  rows,
  eventId,
  flash,
  pendingIds,
  onToggle,
}: {
  label: string;
  rows: RosterEntry[];
  eventId: string;
  flash: DeskFlash;
  pendingIds: ReadonlySet<string>;
  onToggle: (entry: RosterEntry) => void;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <PanelSubHead className="border-line-soft">
        <span id={headingId} className="type-label text-fg-3">
          {label}
        </span>
        <span className="type-data-sm text-fg-2">{rows.length}</span>
      </PanelSubHead>
      <ul>
        {rows.map((entry) => (
          <DeskRow
            key={entry.id}
            entry={entry}
            eventId={eventId}
            flashN={flash?.id === entry.id ? flash.n : undefined}
            pending={pendingIds.has(entry.id)}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </section>
  );
}

function DeskRow({
  entry,
  eventId,
  flashN,
  pending,
  onToggle,
}: {
  entry: RosterEntry;
  eventId: string;
  flashN: number | undefined;
  pending: boolean;
  onToggle: (entry: RosterEntry) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const timeZone = useEventTimeZone();
  const name = dancerName(entry);
  const checkedInAt = entry.checkedInAt;

  // The mockup's 1.4s flash from the pressed surface to transparent, on the
  // row that was just checked in or scanned.
  useEffect(() => {
    const el = ref.current;
    if (flashN === undefined || !el || typeof el.animate !== "function") {
      return;
    }
    // Read the token so the flash follows the light or dark theme.
    const from = getComputedStyle(el)
      .getPropertyValue("--surface-pressed")
      .trim();
    if (!from) return;
    const animation = el.animate(
      [{ backgroundColor: from }, { backgroundColor: "transparent" }],
      { duration: 1400, easing: "ease" },
    );
    return () => animation.cancel();
  }, [flashN]);

  return (
    <li
      ref={ref}
      className="border-line-soft flex min-h-12 items-center gap-(--space-12) border-b py-(--space-6) pr-(--space-8) pl-(--space-14) last:border-b-0"
    >
      <span
        className={cn(
          "flex w-[38px] flex-none",
          checkedInAt ? "[&>button]:text-fg" : "[&>button]:text-fg-3",
        )}
      >
        <DancerBib
          dancer={{
            rosterId: entry.id,
            eventId,
            bibNumber: entry.bibNumber,
            firstName: entry.firstName,
            lastName: entry.lastName,
            email: entry.email,
            studio: entry.profile?.studio ?? null,
            gradYear: entry.profile?.gradYear ?? null,
            gpa: entry.profile?.gpa ?? null,
            state: entry.profile?.state ?? null,
            height: entry.profile?.height ?? null,
            danceStyles: entry.profile?.danceStyles ?? null,
            profilePhotoUrl: entry.profile?.profilePhotoUrl ?? null,
            checkedInAt,
            isRegistered: entry.isRegistered,
          }}
        />
      </span>
      <span className="type-body-strong text-fg min-w-0 flex-1 truncate">
        {name}
      </span>
      {checkedInAt ? (
        <>
          <span className="type-data-sm text-fg-2 inline-flex items-center gap-(--space-6)">
            <Icon icon={CheckIcon} className="text-fg" />
            <time dateTime={checkedInAt}>
              {formatCheckInTime(checkedInAt, timeZone)}
            </time>
          </span>
          <Button
            variant="ghost"
            iconOnly
            label={`Undo check-in for ${name}`}
            title="Undo check-in"
            disabled={pending}
            onClick={() => onToggle(entry)}
          >
            <ArrowCounterClockwiseIcon />
          </Button>
        </>
      ) : (
        <>
          <ShowPassButton entry={entry} eventId={eventId} name={name} />
          <Button
            aria-label={`Check in ${name}`}
            disabled={pending}
            onClick={() => onToggle(entry)}
          >
            Check in
          </Button>
        </>
      )}
    </li>
  );
}

/**
 * Opens the dancer's check-in pass so the desk can show it, e.g. to a dancer
 * without their phone. The signed code loads only while the dialog is open.
 */
function ShowPassButton({
  entry,
  eventId,
  name,
}: {
  entry: RosterEntry;
  eventId: string;
  name: string;
}) {
  const { org } = useOrg();
  const [open, setOpen] = useState(false);
  const code = useQuery({
    ...checkInQueries.rosterCode(org.slug, eventId, entry.id),
    enabled: open,
    retry: false,
  });
  const bib = entry.bibNumber;

  return (
    <>
      <Button
        variant="ghost"
        iconOnly
        label={`Show QR for ${name}`}
        title="Show QR"
        onClick={() => setOpen(true)}
      >
        <QrCodeIcon />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup showCloseButton>
          <DialogHeader>
            <DialogTitle>Check-in pass</DialogTitle>
          </DialogHeader>
          <DialogBody className="items-center p-0">
            <CheckInPass
              bib={bib ?? undefined}
              name={name}
              checkedIn={!!entry.checkedInAt}
              qrValue={code.data?.checkInCode}
              qrLabel={
                bib != null ? `Check-in code for bib ${bib}` : "Check-in code"
              }
              // No bib: drop the empty bib line's gap.
              className={cn(bib == null && "[&>span:first-child]:hidden")}
            >
              {code.data ? undefined : (
                <span
                  role={code.isError ? "alert" : "status"}
                  className="type-caption text-on-fg grid size-full place-items-center text-center"
                >
                  {code.isError ? "Couldn’t load the pass" : "Loading…"}
                </span>
              )}
            </CheckInPass>
            {code.isError && (
              <Button
                variant="secondary"
                className="mb-(--space-24)"
                onClick={() => void code.refetch()}
              >
                Try again
              </Button>
            )}
          </DialogBody>
        </DialogPopup>
      </Dialog>
    </>
  );
}
