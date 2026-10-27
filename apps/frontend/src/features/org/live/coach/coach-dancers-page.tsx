import { Toggle } from "@base-ui/react/toggle";
import {
  HeartIcon,
  HouseIcon,
  ListBulletsIcon,
  MegaphoneSimpleIcon,
  PencilSimpleIcon,
  StarIcon,
  XIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/event/button";
import { Combobox } from "@/components/event/combobox";
import { useDebouncedCallback } from "@/components/hooks/use-debounced-callback";
import { Icon } from "@/components/event/icon";
import { Panel, PanelSeparator, PanelToolbar } from "@/components/event/panel";
import { Search } from "@/components/event/search";
import { Segmented, type SegmentedOption } from "@/components/event/segmented";
import { Select } from "@/components/event/select";
import { Group, GroupSeparator } from "@/components/ui/group";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import { adminQueries } from "@/features/org/api/admin-queries";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import { SubpageHeader } from "@/features/org/live/shared/event-header";
import { ShellPage } from "@/features/org/live/shared/shell-slots";
import { useActiveOrgEvent } from "@/features/org/live/shared/use-active-org-event";
import { REGIONS } from "@/utils/constants/states";

import { useCoachScouting, type ScoutedDancer } from "./coach-scouting";
import {
  DancerRosterCards,
  DancerRosterTable,
  type RosterEmpty,
} from "./dancer-roster-table";
import { useRosterLayout } from "./roster-layout";
import { nextSort, type RosterSort } from "./roster-order";

type Filter = "all" | "called";

const ALL_EVENTS = "all";

/** The server's name for each filter tab. */
const SERVER_FILTER = {
  all: "all",
  called: "calledBack",
} as const;

type Mark = "interested" | "favorited" | "rated" | "hasNote";

/** The toggles that narrow the roster to the coach's own marks, as the old page had. */
const MARKS: {
  value: Mark;
  label: string;
  icon: PhosphorIcon;
  /** Pressed colour, as the roster shows it: gold stars, red hearts. */
  pressedTone?: string;
}[] = [
  { value: "interested", label: "Picked your school", icon: HouseIcon },
  {
    value: "favorited",
    label: "Favorites",
    icon: HeartIcon,
    pressedTone: "data-pressed:text-danger",
  },
  {
    value: "rated",
    label: "Rated",
    icon: StarIcon,
    pressedTone: "data-pressed:text-star",
  },
  { value: "hasNote", label: "Has notes", icon: PencilSimpleIcon },
];

/** The "any" choice that clears the State filter. */
const ANY = "any";

/**
 * GPA buckets, lowest first: at least `gpaMin`, under `gpaBelow`. The keys are
 * not whole numbers so the object keeps this order.
 */
const GPA_RANGES: Record<
  string,
  { label: string; gpaMin?: number; gpaBelow?: number }
> = {
  "under-2.5": { label: "Under 2.5", gpaBelow: 2.5 },
  "2.5-3.0": { label: "2.5-3.0", gpaMin: 2.5, gpaBelow: 3 },
  "3.0-3.5": { label: "3.0-3.5", gpaMin: 3, gpaBelow: 3.5 },
  "3.5-4.0": { label: "3.5-4.0", gpaMin: 3.5, gpaBelow: 4 },
  "4.0+": { label: "4.0+", gpaMin: 4 },
};

const STATE_OPTIONS = [ANY, ...Object.keys(REGIONS)];
const stateLabel = (code: string) =>
  code === ANY ? "Any state" : REGIONS[code as keyof typeof REGIONS];

/**
 * The coach's Dancers page: filter (all / called), toggles for their own marks,
 * GPA and state, search, a sortable roster with their marks on every row, and
 * bulk call back / favorite.
 * It opens on their event; "All events" browses every Org Event's dancers
 * read-only, as the old page allowed before the event started. The server
 * filters, searches, sorts and pages the roster, so a page holds the rows the
 * full list would show in that order.
 */
export function CoachDancersPage() {
  const scouting = useCoachScouting();
  const { slug, callbacksEnabled } = scouting;
  const { event } = useActiveOrgEvent();
  const { data: events } = useQuery(adminQueries.events(slug));

  // `undefined` until the default resolves, so the table doesn't flash every event's dancers.
  const [eventChoice, setEventChoice] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (eventChoice !== undefined || !events) return;
    setEventChoice(
      event?.id ?? events.find((e) => e.isActive)?.id ?? ALL_EVENTS,
    );
  }, [eventChoice, events, event?.id]);
  const eventId =
    eventChoice && eventChoice !== ALL_EVENTS ? eventChoice : undefined;
  const shownEvent = events?.find((e) => e.id === eventId) ?? null;

  const [filter, setFilter] = useState<Filter>("all");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [gpa, setGpa] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // The search the server sees trails the box by a beat, so typing a name
  // sends one request rather than one per letter.
  const [search, setSearch] = useState("");
  const commitSearch = useDebouncedCallback(
    (value: string) => setSearch(value.trim()),
    250,
  );
  const [sort, setSort] = useState<RosterSort>({ key: "bib", dir: "asc" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sheetFor, setSheetFor] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const effectiveFilter =
    !callbacksEnabled && filter === "called" ? "all" : filter;
  const q = search;

  const dancersQuery = useInfiniteQuery({
    ...scoutingQueries.dancerPages(slug, {
      eventId,
      filter: SERVER_FILTER[effectiveFilter],
      search: q || undefined,
      ...Object.fromEntries(marks.map((mark) => [mark, true])),
      gpaMin: gpa ? GPA_RANGES[gpa]?.gpaMin : undefined,
      gpaBelow: gpa ? GPA_RANGES[gpa]?.gpaBelow : undefined,
      state: state ?? undefined,
      sortBy: sort.key,
      sortDir: sort.dir,
    }),
    enabled: eventChoice !== undefined,
    // Keep the old rows up while a new search or sort loads, so the table
    // doesn't blank on every keystroke.
    placeholderData: keepPreviousData,
  });
  const { fetchNextPage } = dancersQuery;
  const pages = dancersQuery.data?.pages;
  const rows = useMemo(
    () => pages?.flatMap((page) => page.data) ?? [],
    [pages],
  );
  const counts = pages?.[0]?.counts;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [rosterBox, setRosterBox] = useState<HTMLDivElement | null>(null);
  const layout = useRosterLayout(rosterBox);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [eventChoice, effectiveFilter, q, marks, gpa, state]);
  useEffect(() => {
    setSheetFor(null);
  }, [eventChoice]);

  const selected = rows.filter((row) => selectedIds.has(row.rosterId));

  // "/" focuses the search; Escape clears the selection (as the old page did).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (typing) return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === "Escape") {
        setSelectedIds(new Set());
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const calledCount = counts?.calledBack;
  const options: SegmentedOption<Filter>[] = [
    {
      value: "all",
      label: "All",
      icon: ListBulletsIcon,
      count: counts?.all,
    },
    ...(callbacksEnabled
      ? [
          {
            value: "called" as const,
            label: "Called",
            icon: MegaphoneSimpleIcon,
            count: calledCount,
          },
        ]
      : []),
  ];

  const allCalled =
    selected.length > 0 && selected.every((d) => d.isCalledBack);
  const allFavorited =
    selected.length > 0 && selected.every((d) => d.isFavorited);

  const runBulk = async (
    targets: ScoutedDancer[],
    run: (dancer: ScoutedDancer) => Promise<unknown>,
    noun: string,
  ) => {
    setBulkBusy(true);
    try {
      const results = await Promise.allSettled(targets.map(run));
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        toastManager.add({
          title: `${failed} of ${targets.length} ${noun} failed`,
          type: "error",
        });
      }
    } finally {
      setBulkBusy(false);
      setSelectedIds(new Set());
    }
  };

  const bulkCall = () =>
    runBulk(
      selected.filter((d) => d.isCalledBack === allCalled),
      (d) => scouting.toggleCallback(d),
      "callbacks",
    );
  const bulkFavorite = () =>
    runBulk(
      selected.filter((d) => d.isFavorited === allFavorited),
      (d) => scouting.toggleFavorite(d),
      "favorites",
    );

  const narrowed = marks.length > 0 || gpa !== null || state !== null;
  const clearFilters = () => {
    setFilter("all");
    setMarks([]);
    setGpa(null);
    setState(null);
    setQuery("");
    setSearch("");
  };

  const empty: RosterEmpty = dancersQuery.isPending
    ? { text: "Loading dancers…" }
    : dancersQuery.isError
      ? {
          text: "Couldn’t load dancers",
          action: (
            <Button onClick={() => dancersQuery.refetch()}>Try again</Button>
          ),
        }
      : counts?.all === 0
        ? { text: "No dancers yet" }
        : {
            text: q
              ? `No matches for “${q}”`
              : narrowed
                ? "No dancers match these filters"
                : "No callbacks yet",
            action: <Button onClick={clearFilters}>Clear filters</Button>,
          };

  const sheetDancer = rows.find((d) => d.rosterId === sheetFor);

  const header = (
    <SubpageHeader
      event={shownEvent ?? event}
      title="Dancers"
      dashboardTo="/o/$orgSlug/coach/event-info"
      showStatus
      actions={
        events && events.length > 1 ? (
          <Select
            label="Event"
            className="bp-small:max-w-[140px] max-w-[220px] min-w-0"
            value={eventChoice ?? null}
            onChange={(value) => value && setEventChoice(value)}
            options={[
              { value: ALL_EVENTS, label: "All events" },
              ...events.map((e) => ({ value: e.id, label: e.name })),
            ]}
          />
        ) : undefined
      }
    />
  );

  const filters = (
    <>
      <MarkToggles value={marks} onChange={setMarks} />
      <Combobox
        aria-label="GPA"
        placeholder="GPA"
        listLabel="GPA"
        options={Object.keys(GPA_RANGES)}
        optionLabel={(value) => GPA_RANGES[value]?.label ?? value}
        value={gpa}
        onChange={(value) => setGpa(value)}
        className="w-[104px] shrink-0"
      />
      <Combobox
        aria-label="State"
        placeholder="State"
        listLabel="States"
        searchPlaceholder="Search states"
        emptyText="No states match"
        options={STATE_OPTIONS}
        optionLabel={stateLabel}
        value={state}
        onChange={(value) => setState(value === ANY ? null : value)}
        className="bp-phone:w-auto bp-phone:flex-1 w-[136px] shrink-0"
      />
    </>
  );

  // Over cards, the toolbar sits in its own panel with no divider under it.
  const toolbarClass = cn(layout.cards && "border-b-0");
  const toolbar =
    selected.length === 0 ? (
      <>
        <PanelToolbar className={toolbarClass}>
          <Segmented
            label="Filter dancers"
            value={effectiveFilter}
            onChange={setFilter}
            options={options}
            iconOnly={!layout.cards && !layout.filterLabels}
          />
          {layout.filterLabels && !layout.cards && filters}
          <Search
            ref={searchRef}
            placeholder="Search…"
            aria-label="Search dancers"
            value={query}
            // Beside icon-only filters the field takes the rest of the bar, as on phones.
            className={cn(
              !layout.cards && !layout.filterLabels && "ms-0 flex-auto",
            )}
            onChange={(event) => {
              setQuery(event.target.value);
              commitSearch(event.target.value);
            }}
          />
        </PanelToolbar>
        {/* Narrower rosters and phones put the filters on a row of their own. */}
        {(layout.cards || !layout.filterLabels) && (
          <PanelToolbar aria-label="Filters" className={toolbarClass}>
            {filters}
          </PanelToolbar>
        )}
      </>
    ) : (
      <PanelToolbar aria-label="Selection" className={toolbarClass}>
        <Button
          variant="ghost"
          iconOnly
          label="Clear selection"
          onClick={() => setSelectedIds(new Set())}
        >
          <Icon icon={XIcon} />
        </Button>
        <span className="type-data-sm text-fg whitespace-nowrap">
          {selected.length} selected
        </span>
        <PanelSeparator />
        {callbacksEnabled && (
          <Button onClick={() => void bulkCall()} disabled={bulkBusy}>
            <Icon icon={MegaphoneSimpleIcon} />
            {allCalled ? "Undo callback" : "Call back"}
          </Button>
        )}
        <Button onClick={() => void bulkFavorite()} disabled={bulkBusy}>
          <Icon icon={HeartIcon} />
          {allFavorited ? "Unfavorite" : "Favorite"}
        </Button>
      </PanelToolbar>
    );

  const list = {
    rows,
    scrollRef,
    // A new search, filter, sort or event starts again from the top.
    resetKey: [eventChoice, effectiveFilter, q, marks, gpa, state, sort],
    hasMore: dancersQuery.hasNextPage && !dancersQuery.isFetchNextPageError,
    loadingMore: dancersQuery.isFetchingNextPage,
    onLoadMore: () => void fetchNextPage(),
    scouting,
    onOpenDancer: setSheetFor,
    empty,
  };
  const scroller = (children: ReactNode) => (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
      {children}
    </div>
  );

  return (
    <ShellPage header={header}>
      {/* The roster's own width, not the window's, picks table or cards. */}
      <div
        ref={setRosterBox}
        className="desk:max-h-[calc(100vh-64px)] flex min-h-0 min-w-0 flex-col gap-(--space-8)"
      >
        {layout.cards ? (
          <>
            <Panel aria-label="Filter dancers">{toolbar}</Panel>
            <Panel aria-label="Dancers" className="min-h-0">
              {scroller(<DancerRosterCards {...list} />)}
            </Panel>
          </>
        ) : (
          <Panel aria-label="Dancers" className="min-h-0">
            {toolbar}
            {scroller(
              <DancerRosterTable
                {...list}
                layout={layout}
                sort={sort}
                onSort={(key) => setSort((current) => nextSort(current, key))}
                selectedIds={selectedIds}
                onSelectedChange={setSelectedIds}
                eventId={eventId}
              />,
            )}
          </Panel>
        )}
      </div>

      <DancerSheet
        rosterId={sheetFor}
        open={sheetFor !== null}
        eventId={sheetDancer?.eventId ?? eventId}
        eventName={
          events?.find((e) => e.id === (sheetDancer?.eventId ?? eventId))?.name
        }
        onOpenChange={(open) => {
          if (!open) setSheetFor(null);
        }}
        readOnly={!sheetDancer || !scouting.canScoutDancer(sheetDancer)}
      />
    </ShellPage>
  );
}

/** Joined toggles, like the roster's Upload | Add, for the coach's own marks. Each one set must hold. */
function MarkToggles({
  value,
  onChange,
}: {
  value: Mark[];
  onChange: (value: Mark[]) => void;
}) {
  return (
    <Group aria-label="Your marks" className="shrink-0">
      {MARKS.map((mark, index) => {
        const pressed = value.includes(mark.value);
        return (
          <Fragment key={mark.value}>
            {index > 0 && <GroupSeparator className="bg-line-control" />}
            <Button
              iconOnly
              label={mark.label}
              title={mark.label}
              className={cn(
                "hover:bg-surface-pressed data-pressed:bg-surface-pressed data-pressed:text-fg-strong text-fg-2",
                mark.pressedTone,
              )}
              render={
                <Toggle
                  pressed={pressed}
                  onPressedChange={(next) =>
                    onChange(
                      next
                        ? [...value, mark.value]
                        : value.filter((v) => v !== mark.value),
                    )
                  }
                />
              }
            >
              <Icon icon={mark.icon} weight={pressed ? "fill" : "regular"} />
            </Button>
          </Fragment>
        );
      })}
    </Group>
  );
}
