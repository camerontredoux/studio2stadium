import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  QrCodeIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { useDebouncedCallback } from "@/components/hooks/use-debounced-callback";
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
import { useVirtualRows } from "@/features/org/live/shared/use-virtual-rows";

import {
  type DeskFilter,
  checkInPercent,
  dancerName,
  emptyMessage,
  formatCheckInTime,
} from "./desk-list";
import { useDeskList } from "./use-desk-data";
import { useEventTimeZone } from "@/features/org/live/shared/use-event-time-zone";

/** The last row checked in or scanned; a new `n` replays the flash. */
export type DeskFlash = { id: string; n: number } | null;

export interface DancersPanelProps {
  eventId: string;
  total: number;
  checkedIn: number;
  notYet: number;
  flash: DeskFlash;
  /** Roster Entry ids with a check-in or undo in flight. */
  pendingIds: ReadonlySet<string>;
  /** Only ever called to change state: check in a dancer who isn't, undo one who is. */
  onToggle: (entry: RosterEntry) => void;
}

type DeskItem =
  | { kind: "group"; key: "out" | "in"; label: string; count: number }
  | { kind: "dancer"; entry: RosterEntry };

/** A dancer row's height before it's measured (48px plus its border). */
const ROW_ESTIMATE = 49;

export function DancersPanel({
  eventId,
  total,
  checkedIn,
  notYet,
  flash,
  pendingIds,
  onToggle,
}: DancersPanelProps) {
  const { org } = useOrg();
  const [filter, setFilter] = useState<DeskFilter>("all");
  const [query, setQuery] = useState("");
  // The search the server sees trails the box by a beat, so typing a name
  // sends one request rather than one per letter. A leading "#" is a bib.
  const [search, setSearch] = useState("");
  const commitSearch = useDebouncedCallback(
    (value: string) => setSearch(value.trim().replace(/^#/, "")),
    250,
  );
  const percent = checkInPercent(checkedIn, total);

  const showOut = filter !== "in";
  const showIn = filter !== "out";
  const out = useDeskList(org.slug, eventId, {
    checkedIn: false,
    search,
    enabled: showOut,
  });
  const checkedInList = useDeskList(org.slug, eventId, {
    checkedIn: true,
    search,
    enabled: showIn,
  });
  // Under "All", "Checked in" follows "Not yet", so its rows show once the
  // last "Not yet" page has loaded.
  const inShown =
    showIn && (!showOut || (out.query.isSuccess && !out.query.hasNextPage));
  const loading =
    (showOut && out.query.isPending) ||
    (showIn && checkedInList.query.isPending);
  const failed =
    (showOut && out.query.isError && !out.query.isFetchNextPageError) ||
    (showIn &&
      checkedInList.query.isError &&
      !checkedInList.query.isFetchNextPageError);

  const items = useMemo(() => {
    const list: DeskItem[] = [];
    if (showOut && out.rows.length > 0) {
      list.push({
        kind: "group",
        key: "out",
        label: "Not yet",
        count: out.total,
      });
      for (const entry of out.rows) list.push({ kind: "dancer", entry });
    }
    if (inShown && checkedInList.rows.length > 0) {
      list.push({
        kind: "group",
        key: "in",
        label: "Checked in",
        count: checkedInList.total,
      });
      for (const entry of checkedInList.rows) {
        list.push({ kind: "dancer", entry });
      }
    }
    return list;
  }, [
    showOut,
    out.rows,
    out.total,
    inShown,
    checkedInList.rows,
    checkedInList.total,
  ]);

  const more =
    showOut && out.query.hasNextPage
      ? out.query
      : inShown
        ? checkedInList.query
        : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [listEl, setListEl] = useState<HTMLUListElement | null>(null);
  const virtual = useVirtualRows({
    count: items.length,
    scrollRef,
    list: listEl,
    estimate: ROW_ESTIMATE,
    hasMore: !!more?.hasNextPage && !more.isFetchNextPageError,
    loadingMore: !!more?.isFetchingNextPage,
    onLoadMore: () => void more?.fetchNextPage(),
  });

  // A new search or filter starts again from the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [filter, search]);

  return (
    <Panel aria-label="Dancers" className="desk:max-h-[calc(100vh-64px)]">
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
          placeholder="Search"
          aria-label="Search dancers by name or bib"
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            commitSearch(event.target.value);
          }}
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

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <DeskEmpty>Loading dancers</DeskEmpty>
        ) : failed ? (
          <DeskEmpty>
            Couldn’t load the roster.{" "}
            <Button
              variant="secondary"
              onClick={() => {
                void out.query.refetch();
                void checkedInList.query.refetch();
              }}
            >
              Try again
            </Button>
          </DeskEmpty>
        ) : items.length === 0 ? (
          <DeskEmpty>
            {emptyMessage({ filter, query: search, total })}
          </DeskEmpty>
        ) : (
          <ul ref={setListEl} aria-label="Dancers">
            <ListSpacer height={virtual.padTop} />
            {virtual.items.map((item) => {
              const deskItem = items[item.index]!;
              return deskItem.kind === "group" ? (
                <li
                  key={deskItem.key}
                  ref={virtual.measure}
                  data-index={item.index}
                  data-testid={`desk-group-${deskItem.key}`}
                >
                  <PanelSubHead className="border-line-soft">
                    <span className="type-label text-fg-3">
                      {deskItem.label}
                    </span>
                    <span className="type-data-sm text-fg-2">
                      {deskItem.count}
                    </span>
                  </PanelSubHead>
                </li>
              ) : (
                <DeskRow
                  key={deskItem.entry.id}
                  ref={virtual.measure}
                  index={item.index}
                  entry={deskItem.entry}
                  eventId={eventId}
                  flashN={flash?.id === deskItem.entry.id ? flash.n : undefined}
                  pending={pendingIds.has(deskItem.entry.id)}
                  onToggle={onToggle}
                  // A group heading or the panel's border closes the row.
                  closing={
                    virtual.isLast(item.index) ||
                    items[item.index + 1]?.kind === "group"
                  }
                />
              );
            })}
            <ListSpacer height={virtual.padBottom} />
            {more?.isFetchingNextPage && (
              <li className="text-fg-3 type-meta py-(--space-12) text-center">
                Loading more dancers…
              </li>
            )}
          </ul>
        )}
      </div>
    </Panel>
  );
}

/** Stands in for the rows scrolled out of view. */
function ListSpacer({ height }: { height: number }) {
  if (height <= 0) return null;
  return <li aria-hidden style={{ height }} />;
}

function DeskEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="type-body text-fg-3 px-(--space-14) py-[28px] text-center">
      {children}
    </p>
  );
}

function DeskRow({
  ref: measure,
  index,
  entry,
  eventId,
  flashN,
  pending,
  onToggle,
  closing,
}: {
  /** The virtualizer measures the row through this. */
  ref: (el: HTMLLIElement | null) => void;
  index: number;
  entry: RosterEntry;
  eventId: string;
  flashN: number | undefined;
  pending: boolean;
  onToggle: (entry: RosterEntry) => void;
  /** The last row above a group heading or the panel's edge: no divider. */
  closing: boolean;
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
      ref={(el) => {
        ref.current = el;
        measure(el);
      }}
      data-index={index}
      className={cn(
        "border-line-soft flex min-h-12 items-center gap-(--space-12) border-b py-(--space-6) pr-(--space-8) pl-(--space-14)",
        closing && "border-b-0",
      )}
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
