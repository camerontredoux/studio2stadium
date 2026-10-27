import { DownloadSimpleIcon } from "@phosphor-icons/react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { AuditLogRow } from "@/components/event/audit-diff";
import { Button } from "@/components/event/button";
import { DataTable } from "@/components/event/data-table";
import { Icon } from "@/components/event/icon";
import { Label } from "@/components/event/label";
import { Panel } from "@/components/event/panel";
import { useDebouncedCallback } from "@/components/hooks/use-debounced-callback";
import { toastManager } from "@/components/ui/toast-manager";
import { cn } from "@/components/utils/cn";
import {
  auditQueries,
  fetchAuditPage,
  type AuditLogEntry,
} from "@/features/org/api/audit-queries";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { SubpageHeader } from "@/features/org/live/shared/event-header";
import { PersonAvatar } from "@/features/org/live/shared/person-avatar";
import { ShellPage } from "@/features/org/live/shared/shell-slots";
import { useVirtualRows } from "@/features/org/live/shared/use-virtual-rows";
import { Spacer } from "@/features/org/live/shared/virtual-spacer";

import { AuditEntryDetail } from "./audit-entry-detail";
import { auditCsv, auditCsvFilename, downloadCsv } from "./audit-export";
import { AuditFilterBar } from "./audit-filter-bar";
import { AuditStatsPanel, AuditStatsRail } from "./audit-stats";
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  toListParams,
  type AuditFilters,
} from "./audit-filters";
import {
  ACTION_LABELS,
  absoluteTime,
  actorName,
  displayAction,
  RESOURCE_LABELS,
  relativeTime,
  subjectLabel,
  summarizeEntry,
  type AuditDisplayAction,
} from "./audit-format";

const PAGE_SIZE = 50;
/** Export pages through the whole log at the API's largest page. */
const EXPORT_PAGE_SIZE = 200;
/** A collapsed row's height before it's measured. */
const ROW_ESTIMATE = 41;
// The container's border closes the list, so the last row drops its divider,
// open or shut.
const lastRow =
  "[&_[data-slot=collapsible-trigger]]:border-b-0 [&_[data-slot=collapsible-panel]>div]:border-b-0";

// Mockup `.al-grid`: chevron, timestamp, actor, action, resource, dancer, summary
// (940px min). The Activity rail and sidebar make the panel narrower than that
// at many widths, so the table sizes by its own container: under 940px,
// Resource and Dancer drop (both show when a row expands). The template comes
// from `--audit-cols` so it can change with the container.
const auditCols =
  "[--audit-cols:16px_104px_minmax(120px,1fr)_112px_120px_minmax(130px,1fr)_minmax(220px,2fr)] " +
  "@max-[940px]:[--audit-cols:16px_104px_minmax(100px,1fr)_112px_minmax(200px,2fr)]";
// Phones (≤800): each row is a card. Chevron, actor and time on the first
// line; action, then the summary, wrap below under the actor.
const phoneColumns = "16px minmax(0,1fr) max-content";
// On phones each entry lays out its own grid instead of a nested subgrid:
// Safari keeps a subgrid inside the rows' negative margins, which left a band
// down the right and dropped the column gap after the chevron.
const phoneEntry = "bp-phone:block";
const phoneRow =
  "bp-phone:grid-cols-[16px_minmax(0,1fr)_max-content] bp-phone:gap-x-(--space-10) bp-phone:gap-y-(--space-4) bp-phone:py-(--space-10)";
const phoneBelow = "bp-phone:col-[2/-1]";
const hideBelowBoard = "@max-[940px]:hidden";
// Full-width rows inside the table cancel its side padding (see DataTable).
const rowEdge = "-mx-(--dt-pad)";
const rowPad = "px-(--dt-pad)";

/** A clock for relative times; ticks every minute. */
function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function EmptyRow({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="text-fg-3 flex flex-wrap items-center justify-center gap-(--space-10) px-(--space-14) py-[28px] text-center">
      <span>{children}</span>
      {action}
    </div>
  );
}

function EntrySummary({
  entry,
  now,
  timeZone,
}: {
  entry: AuditLogEntry;
  now: Date;
  timeZone: string | null;
}) {
  const action = displayAction(entry);
  const dancer = subjectLabel(entry);
  return (
    <>
      <span
        className="type-data-sm text-fg-2 bp-phone:col-start-3 bp-phone:row-start-1 bp-phone:justify-self-end whitespace-nowrap"
        title={absoluteTime(entry.createdAt, timeZone)}
      >
        {relativeTime(entry.createdAt, now)}
      </span>
      <span className="bp-phone:col-start-2 bp-phone:row-start-1 flex min-w-0 items-center gap-(--space-8)">
        <PersonAvatar
          firstName={entry.actor.firstName}
          lastName={entry.actor.lastName}
          src={entry.actor.avatarUrl}
          className="size-6"
        />
        <span className="min-w-0 truncate font-medium">{actorName(entry)}</span>
      </span>
      <span
        className={cn(
          "type-label min-w-0 truncate",
          action === "delete" ? "text-danger" : "text-fg",
          phoneBelow,
          "bp-phone:row-start-2",
        )}
      >
        {ACTION_LABELS[action]}
      </span>
      <span className={cn("text-fg-2 min-w-0 truncate", hideBelowBoard)}>
        {RESOURCE_LABELS[entry.resource] ?? entry.resource}
      </span>
      <span
        className={cn(
          "flex min-w-0 items-center gap-(--space-8)",
          dancer ? "text-fg" : "text-fg-disabled",
          hideBelowBoard,
        )}
      >
        {entry.subject && dancer && (
          <PersonAvatar
            firstName={entry.subject.firstName}
            lastName={entry.subject.lastName}
            src={entry.subject.avatarUrl}
            className="size-6"
          />
        )}
        <span className="min-w-0 truncate">{dancer ?? "—"}</span>
      </span>
      <span
        className={cn(
          "text-fg-2 min-w-0 truncate",
          phoneBelow,
          "bp-phone:row-start-3 bp-phone:whitespace-normal bp-phone:[overflow-wrap:anywhere]",
        )}
      >
        {summarizeEntry(entry, timeZone)}
        {entry.childCount > 0 && (
          <span className="text-fg-3"> · {entry.childCount} entries</span>
        )}
      </span>
    </>
  );
}

export type AuditLogPageProps = { orgSlug: string };

/** The admin audit log: filter chips, search, and expandable entries with their diffs. */
export function AuditLogPage({ orgSlug }: AuditLogPageProps) {
  const { events, selectedEvent } = useAdminEvent();
  const eventId = selectedEvent?.id ?? "";
  // The event's zone, as the backend resolves it (its own, else the org
  // default): the display and the day filters both count days in it.
  const timeZone =
    selectedEvent?.timezone ?? selectedEvent?.effectiveTimezone ?? null;
  const eventDates = selectedEvent
    ? {
        startDate: selectedEvent.startDate,
        endDate: selectedEvent.endDate,
        timeZone,
      }
    : null;
  const now = useNow();

  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS);
  const [searchText, setSearchText] = useState("");
  // Date presets are relative to when they were picked, so the query key
  // doesn't change every time the clock ticks.
  const [anchor, setAnchor] = useState(() => new Date());

  const applyFilters = (next: AuditFilters) => {
    setFilters(next);
    setAnchor(new Date());
  };
  const applySearch = useDebouncedCallback((search: string) => {
    setFilters((current) => ({ ...current, search }));
  }, 300);

  const clearFilters = () => {
    setSearchText("");
    applyFilters(EMPTY_FILTERS);
  };

  const params = useMemo(
    () => toListParams(filters, anchor, eventDates),
    // eventDates is rebuilt each render; its strings are the dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, anchor, eventDates?.startDate, eventDates?.endDate, timeZone],
  );

  const entriesQuery = useInfiniteQuery({
    ...auditQueries.listPages(orgSlug, eventId, params, PAGE_SIZE),
    enabled: !!eventId,
    // Keep the old entries up while new filters load.
    placeholderData: keepPreviousData,
  });
  const { fetchNextPage } = entriesQuery;
  const statsQuery = useQuery({
    ...auditQueries.stats(orgSlug, eventId),
    enabled: !!eventId,
  });

  const statsProps = {
    stats: statsQuery.data,
    isPending: statsQuery.isPending,
    isError: statsQuery.isError,
    onRetry: () => void statsQuery.refetch(),
  };

  const pages = entriesQuery.data?.pages;
  const rows = useMemo(
    () => pages?.flatMap((page) => page.data) ?? [],
    [pages],
  );
  const total = pages?.[0]?.total ?? 0;
  const filtered = hasActiveFilters(filters) || searchText.trim() !== "";

  const scrollRef = useRef<HTMLDivElement>(null);
  const [table, setTable] = useState<HTMLDivElement | null>(null);
  const virtual = useVirtualRows({
    count: rows.length,
    scrollRef,
    list: table,
    estimate: ROW_ESTIMATE,
    hasMore: entriesQuery.hasNextPage && !entriesQuery.isFetchNextPageError,
    loadingMore: entriesQuery.isFetchingNextPage,
    onLoadMore: () => void fetchNextPage(),
    // A new tab, search or filter starts again from the top.
    resetKey: params,
  });

  // The stats count top-level entries per API action. Check-ins are API
  // updates, so neither "Update" nor "Check in" gets a count.
  const actionCounts = useMemo(() => {
    const counts: Partial<Record<AuditDisplayAction, number>> = {};
    for (const { action, count } of statsQuery.data?.actionBreakdown ?? []) {
      if (action !== "update") counts[action] = count;
    }
    return counts;
  }, [statsQuery.data]);

  // Saves every entry that matches the filters, not only the loaded ones.
  const [exporting, setExporting] = useState(false);
  const exportMatching = async () => {
    setExporting(true);
    try {
      const entries: AuditLogEntry[] = [];
      for (let page = 0; ; page++) {
        const result = await fetchAuditPage(orgSlug, eventId, {
          ...params,
          page,
          limit: EXPORT_PAGE_SIZE,
        });
        entries.push(...result.data);
        if (result.data.length === 0 || entries.length >= result.total) break;
      }
      downloadCsv(
        auditCsvFilename(selectedEvent?.name ?? null, new Date()),
        auditCsv(entries, timeZone),
      );
      toastManager.add({
        title: `Exported ${entries.length.toLocaleString()} ${entries.length === 1 ? "entry" : "entries"}`,
        type: "success",
      });
    } catch {
      toastManager.add({ title: "Export failed", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  const header = (
    <SubpageHeader
      event={selectedEvent ?? null}
      title="Audit log"
      dashboardTo="/o/$orgSlug/admin"
      showStatus
      actions={
        <Button
          aria-label="Export matching entries as CSV"
          disabled={rows.length === 0 || exporting}
          onClick={() => void exportMatching()}
        >
          <Icon icon={DownloadSimpleIcon} />
          <span className="bp-small:hidden">Export</span>
        </Button>
      }
    />
  );

  if (!selectedEvent) {
    return (
      <ShellPage header={header}>
        <EmptyRow>
          {events.length === 0
            ? "No events yet."
            : "Select an event to view its audit log."}
        </EmptyRow>
      </ShellPage>
    );
  }

  let body: ReactNode = null;
  if (entriesQuery.isPending) {
    body = <EmptyRow>Loading entries…</EmptyRow>;
  } else if (entriesQuery.isError && !entriesQuery.isFetchNextPageError) {
    body = (
      <EmptyRow
        action={
          <Button onClick={() => void entriesQuery.refetch()}>Try again</Button>
        }
      >
        Couldn’t load the audit log
      </EmptyRow>
    );
  } else if (rows.length === 0) {
    body = filtered ? (
      <EmptyRow action={<Button onClick={clearFilters}>Clear filters</Button>}>
        No entries match
      </EmptyRow>
    ) : (
      <EmptyRow>No activity recorded yet</EmptyRow>
    );
  }

  const footer =
    rows.length > 0 ? (
      <div className="border-line-soft text-fg-3 type-caption flex min-h-11 shrink-0 flex-wrap items-center gap-(--space-10) border-t px-(--space-14) py-(--space-6)">
        <span aria-live="polite">
          {`${total.toLocaleString()} ${total === 1 ? "entry" : "entries"}`}
          {entriesQuery.isFetchingNextPage && " · Loading more…"}
        </span>
      </div>
    ) : null;

  return (
    <ShellPage header={header} rail={<AuditStatsRail {...statsProps} />}>
      <div className="flex min-w-0 flex-col gap-(--space-8)">
        <AuditStatsPanel {...statsProps} />
        <Panel aria-label="Audit log" className="desk:max-h-[calc(100vh-64px)]">
          <AuditFilterBar
            filters={filters}
            onFiltersChange={applyFilters}
            searchText={searchText}
            onSearchTextChange={(text) => {
              setSearchText(text);
              applySearch(text.trim());
            }}
            onClear={clearFilters}
            event={eventDates}
            now={now}
            actionCounts={actionCounts}
          />
          <div
            ref={scrollRef}
            className="@container min-h-0 flex-auto overflow-auto"
          >
            {/* Rows are collapsibles, not table rows, so the grid drops the table role. */}
            <DataTable
              ref={setTable}
              role={undefined}
              columns="var(--audit-cols)"
              phoneColumns={phoneColumns}
              className={cn(
                auditCols,
                "desk:@max-[940px]:min-w-[608px] bp-phone:min-w-0 min-w-[940px]",
              )}
            >
              <div
                className={cn(
                  "bg-surface-head border-line-soft bp-phone:hidden sticky top-0 z-2 col-span-full grid min-h-8 grid-cols-subgrid items-center border-b",
                  rowEdge,
                  rowPad,
                )}
              >
                <span />
                <Label className="text-fg-3 truncate">Timestamp</Label>
                <Label className="text-fg-3 truncate">Actor</Label>
                <Label className="text-fg-3 truncate">Action</Label>
                <Label className={cn("text-fg-3 truncate", hideBelowBoard)}>
                  Resource
                </Label>
                <Label className={cn("text-fg-3 truncate", hideBelowBoard)}>
                  Dancer
                </Label>
                <Label className="text-fg-3 truncate">Summary</Label>
              </div>
              <Spacer height={virtual.padTop} />
              {virtual.items.map((item) => {
                const entry = rows[item.index]!;
                return (
                  // Measured as one item, so an open entry counts too.
                  <div
                    key={entry.id}
                    ref={virtual.measure}
                    data-index={item.index}
                    className={cn(
                      "col-span-full grid grid-cols-subgrid",
                      virtual.isLast(item.index) && lastRow,
                    )}
                  >
                    <AuditLogRow
                      className={cn(rowEdge, phoneEntry)}
                      rowClassName={cn(rowPad, phoneRow)}
                      summary={
                        <EntrySummary
                          entry={entry}
                          now={now}
                          timeZone={timeZone}
                        />
                      }
                    >
                      <AuditEntryDetail
                        entry={entry}
                        orgSlug={orgSlug}
                        eventId={eventId}
                        timeZone={timeZone}
                        now={now}
                      />
                    </AuditLogRow>
                  </div>
                );
              })}
              <Spacer height={virtual.padBottom} />
            </DataTable>
          </div>
          {body}
          {footer}
        </Panel>
      </div>
    </ShellPage>
  );
}
