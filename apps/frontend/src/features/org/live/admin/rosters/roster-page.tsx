import {
  ArrowCounterClockwiseIcon,
  ArrowsMergeIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  ListBulletsIcon,
  PlusIcon,
  TrashIcon,
  UploadSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ReactNode, useRef, useState } from "react";

import { Button } from "@/components/event/button";
import { DataTableEmpty } from "@/components/event/data-table";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/event/dialog";
import { Icon } from "@/components/event/icon";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "@/components/event/menu";
import { Panel, PanelSeparator, PanelToolbar } from "@/components/event/panel";
import { Search } from "@/components/event/search";
import { Segmented } from "@/components/event/segmented";
import { useDebouncedCallback } from "@/components/hooks/use-debounced-callback";
import { Group, GroupSeparator } from "@/components/ui/group";
import { toastManager } from "@/components/ui/toast-manager";
import {
  useAdminCheckInToggle,
  useResetCheckIn,
} from "@/features/org/api/check-in-queries";
import {
  downloadRosterCsv,
  rosterQueries,
  useDeleteRosters,
  useResendInvites,
  type RosterEntry,
  type RosterType,
} from "@/features/org/api/roster-queries";
import { CsvUploadDialog } from "@/features/org/components/csv-upload-dialog";
import { ResetCheckInDialog } from "@/features/org/components/reset-check-in-dialog";
import type { OrgEvent } from "@/features/org/api/admin-queries";
import { reconciliationQueries } from "@/features/org/api/reconciliation-queries";
import { useAdminEvent } from "@/features/org/context/use-admin-event";
import { useOrg } from "@/features/org/context/use-org";
import { RosterDetailSheet } from "@/features/org/live/admin/rosters/detail-sheet/roster-detail-sheet";
import { SubpageHeader } from "@/features/org/live/shared/event-header";
import { ShellPage } from "@/features/org/live/shared/shell-slots";

import {
  bulkCheckInPlan,
  countLabel,
  mergePages,
  nextSort,
  ROSTER_KINDS,
  rosterColumns,
  type RosterKindConfig,
  type RosterSearch,
  type RosterSortKey,
  type RosterStatusFilter,
} from "./roster-config";
import { RosterTable } from "./roster-table";

const PAGE_SIZE = 50;

export interface RosterPageProps {
  type: RosterType;
  orgSlug: string;
  search: RosterSearch;
  /** Merges a change into the URL's search params (`undefined` clears a key). */
  onSearchChange: (patch: Partial<RosterSearch>) => void;
}

/** The admin Dancers or Coaches roster: filter, search, sort, select and act on Roster Entries. */
export function RosterPage(props: RosterPageProps) {
  const { selectedEvent } = useAdminEvent();

  if (!selectedEvent) {
    return (
      <ShellPage
        header={
          <SubpageHeader
            event={null}
            title={ROSTER_KINDS[props.type].title}
            dashboardTo="/o/$orgSlug/admin"
          />
        }
      >
        <Panel className="text-fg-3 type-body items-center justify-center p-(--space-24)">
          No event selected.
        </Panel>
      </ShellPage>
    );
  }

  return <RosterPageContent {...props} event={selectedEvent} />;
}

function RosterPageContent({
  type,
  orgSlug,
  event,
  search,
  onSearchChange,
}: RosterPageProps & { event: OrgEvent }) {
  const eventId = event.id;
  const eventName = event.name;
  const config = ROSTER_KINDS[type];
  const { hasFeature } = useOrg();
  const checkInEnabled = hasFeature("check_in");
  const freeTierEnabled = hasFeature("freeTierUsers");
  const isDancers = type === "dancer";
  const columns = rosterColumns(type, {
    checkIn: checkInEnabled,
    freeTier: freeTierEnabled,
  });

  const { status, q } = search;
  const sort = search.sort;
  const dir = search.dir ?? "asc";

  // Selection belongs to one view of the list; a new filter, search or sort
  // starts it over.
  const viewKey = JSON.stringify([status, q, sort, dir]);
  const [selection, setSelection] = useState({
    key: viewKey,
    ids: new Set<string>() as ReadonlySet<string>,
  });
  const selectedIds =
    selection.key === viewKey ? selection.ids : new Set<string>();
  const setSelectedIds = (ids: ReadonlySet<string>) =>
    setSelection({ key: viewKey, ids });

  const rosterQuery = useInfiniteQuery({
    ...rosterQueries.listPages(
      orgSlug,
      eventId,
      {
        type,
        search: q || undefined,
        status: status === "all" ? undefined : status,
        sortBy: sort,
        sortDir: sort ? dir : undefined,
      },
      PAGE_SIZE,
    ),
    // Keep the old rows up while a new search or sort loads, so the table
    // doesn't blank on every keystroke.
    placeholderData: keepPreviousData,
  });
  const { fetchNextPage } = rosterQuery;
  const rows = mergePages(rosterQuery.data?.pages.map((p) => p.data) ?? []);

  const scrollRef = useRef<HTMLDivElement>(null);

  const statsQuery = useQuery(rosterQueries.stats(orgSlug, eventId, type));
  const stats = statsQuery.data;
  // Coaches link to Reconciliation; the count is what still needs an admin.
  const reconciliation = useQuery({
    ...reconciliationQueries.counts(orgSlug, eventId),
    enabled: type === "coach",
  });
  const toReconcile = reconciliation.data
    ? reconciliation.data.unclaimed + reconciliation.data.orphans
    : undefined;

  const selected = rows.filter((r) => selectedIds.has(r.id));

  // Sheet: keep the entry it opened with so it can animate out after a delete.
  const [sheetEntry, setSheetEntry] = useState<RosterEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const liveSheetEntry =
    (sheetEntry && rows.find((r) => r.id === sheetEntry.id)) ?? sheetEntry;
  const openEntry = (entry: RosterEntry) => {
    setSheetEntry(entry);
    setSheetOpen(true);
  };

  const [uploadOpen, setUploadOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const deleteMutation = useDeleteRosters();
  const resendMutation = useResendInvites();
  const checkInToggle = useAdminCheckInToggle();
  const resetCheckInMutation = useResetCheckIn();
  const [checkingIn, setCheckingIn] = useState(false);

  // Search: type freely, write to the URL after a pause.
  const [draft, setDraft] = useState(q ?? "");
  const [syncedQ, setSyncedQ] = useState(q);
  if (syncedQ !== q) {
    setSyncedQ(q);
    setDraft(q ?? "");
  }
  const commitQuery = useDebouncedCallback((value: string) => {
    onSearchChange({ q: value.trim() || undefined });
  }, 250);

  const setStatus = (next: RosterStatusFilter) =>
    onSearchChange({ status: next === "all" ? undefined : next });
  const handleSort = (key: RosterSortKey) =>
    onSearchChange(nextSort({ sort, dir }, key));
  const filtered = status !== "all" || !!q;
  const clearFilters = () => {
    setDraft("");
    onSearchChange({ status: undefined, q: undefined });
  };

  const handleExport = async () => {
    try {
      await downloadRosterCsv(orgSlug, eventId, {
        type,
        search: q || undefined,
        status: status === "all" ? undefined : status,
      });
    } catch {
      toastManager.add({ title: "Export failed", type: "error" });
    }
  };

  const handleResend = async () => {
    const ids = selected.filter((r) => !r.isRegistered).map((r) => r.id);
    if (ids.length === 0) return;
    try {
      const result = await resendMutation.mutateAsync({
        params: { path: { slug: orgSlug, id: eventId } },
        body: { ids },
      });
      if (result.failed.length > 0) {
        toastManager.add({
          title: `Resent ${result.sent}, ${result.failed.length} failed`,
          type: "warning",
        });
      } else {
        toastManager.add({
          title: `Resent ${result.sent} invite${result.sent === 1 ? "" : "s"}${result.skipped ? ` (${result.skipped} skipped)` : ""}`,
          type: "success",
        });
      }
    } catch {
      toastManager.add({ title: "Failed to resend invites", type: "error" });
    }
  };

  const checkInPlan = bulkCheckInPlan(selected);
  const handleBulkCheckIn = async () => {
    const { label, targets } = checkInPlan;
    setCheckingIn(true);
    const results = await Promise.allSettled(
      targets.map((r) =>
        checkInToggle.mutateAsync({
          slug: orgSlug,
          eventId,
          rosterId: r.id,
          currentlyCheckedIn: !!r.checkedInAt,
        }),
      ),
    );
    setCheckingIn(false);
    const failed = results.filter((r) => r.status === "rejected").length;
    const done = targets.length - failed;
    if (failed > 0) {
      toastManager.add({
        title: `Failed to update check-in for ${countLabel(failed, config)}`,
        type: "error",
      });
    }
    if (done > 0) {
      toastManager.add({
        title:
          label === "Check in"
            ? `Checked in ${countLabel(done, config)}`
            : `Undid check-in for ${countLabel(done, config)}`,
        type: "success",
      });
    }
  };

  const handleRemove = async () => {
    const ids = selected.map((r) => r.id);
    try {
      await deleteMutation.mutateAsync({
        params: {
          path: { slug: orgSlug, id: eventId },
          // @ts-expect-error -- OpenAPI spec omits query params; backend reads via request.all()
          query: { ids },
        },
      });
      setRemoveOpen(false);
      setSelectedIds(new Set());
      toastManager.add({
        title: `${countLabel(ids.length, config)} removed`,
        type: "success",
      });
    } catch {
      toastManager.add({
        title: `Failed to remove ${config.plural}`,
        type: "error",
      });
    }
  };

  const handleResetCheckIn = async () => {
    try {
      const result = await resetCheckInMutation.mutateAsync({
        slug: orgSlug,
        eventId,
      });
      setResetOpen(false);
      toastManager.add({
        title: `Check-in reset for ${result.reset} dancer${result.reset === 1 ? "" : "s"}`,
        type: "success",
      });
    } catch {
      toastManager.add({ title: "Failed to reset check-in", type: "error" });
    }
  };

  const header = (
    <SubpageHeader
      event={event}
      title={config.title}
      dashboardTo="/o/$orgSlug/admin"
      showStatus
      actions={
        <RosterHeaderActions
          config={config}
          onUpload={() => setUploadOpen(true)}
          onExport={handleExport}
          onResetCheckIn={
            isDancers && checkInEnabled ? () => setResetOpen(true) : undefined
          }
          checkedInCount={stats?.checkedIn ?? 0}
          reconcile={
            type === "coach" ? (
              <Button
                variant="ghost"
                // Phones show the icon and count, and small phones the icon only (the count stays in the label), so the "Coaches" title keeps its room.
                className="bp-phone:px-(--space-6)"
                label={
                  toReconcile
                    ? `Reconciliation, ${toReconcile} to review`
                    : "Reconciliation"
                }
                title="Unclaimed school invites and coach rows with no account"
                render={
                  <Link
                    to="/o/$orgSlug/admin/reconciliation"
                    params={{ orgSlug }}
                  />
                }
              >
                <Icon icon={ArrowsMergeIcon} />
                <span className="bp-phone:hidden">Reconciliation</span>
                {!!toReconcile && (
                  <span className="text-fg-3 bp-small:hidden font-mono tabular-nums">
                    {toReconcile}
                  </span>
                )}
              </Button>
            ) : undefined
          }
        />
      }
    />
  );

  const empty = rosterQuery.isPending ? (
    <DataTableEmpty>Loading {config.plural}…</DataTableEmpty>
  ) : rosterQuery.isError ? (
    <DataTableEmpty
      action={
        <Button onClick={() => void rosterQuery.refetch()}>Try again</Button>
      }
    >
      Couldn’t load {config.plural}
    </DataTableEmpty>
  ) : (
    <DataTableEmpty
      action={
        filtered ? (
          <Button onClick={clearFilters}>Clear filters</Button>
        ) : (
          <Button onClick={() => setUploadOpen(true)}>
            <Icon icon={UploadSimpleIcon} />
            Upload CSV
          </Button>
        )
      }
    >
      {emptyText(config, status, q)}
    </DataTableEmpty>
  );

  return (
    <ShellPage header={header}>
      <Panel
        aria-label={config.title}
        className="desk:max-h-[calc(100vh-64px)]"
        data-testid={`roster-${type}`}
      >
        {selected.length === 0 ? (
          <PanelToolbar>
            <Segmented
              label="Filter by status"
              value={status}
              onChange={setStatus}
              options={[
                {
                  value: "all",
                  label: "All",
                  icon: ListBulletsIcon,
                  count: stats?.total ?? "–",
                },
                {
                  value: "active",
                  label: "Active",
                  icon: CheckCircleIcon,
                  count: stats?.active ?? "–",
                },
                {
                  value: "pending",
                  label: "Pending",
                  icon: ClockIcon,
                  count: stats?.pending ?? "–",
                },
              ]}
            />
            <Search
              placeholder="Search"
              aria-label={config.searchLabel}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                commitQuery(event.target.value);
              }}
            />
          </PanelToolbar>
        ) : (
          <PanelToolbar aria-label="Selection">
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
            {selected.some((r) => !r.isRegistered) && (
              <Button
                onClick={handleResend}
                disabled={resendMutation.isPending}
                label="Resend invite"
                className="bp-small:w-(--control) bp-small:px-0"
              >
                <Icon icon={EnvelopeSimpleIcon} />
                <span className="bp-small:hidden">Resend invite</span>
              </Button>
            )}
            {isDancers && checkInEnabled && (
              <Button onClick={handleBulkCheckIn} disabled={checkingIn}>
                <Icon
                  icon={
                    checkInPlan.label === "Check in"
                      ? CheckIcon
                      : ArrowCounterClockwiseIcon
                  }
                />
                {checkInPlan.label}
              </Button>
            )}
            <span className="flex-1" />
            <Button
              variant="danger"
              onClick={() => setRemoveOpen(true)}
              label="Remove"
              className="bp-small:w-(--control) bp-small:px-0"
            >
              <Icon icon={TrashIcon} />
              <span className="bp-small:hidden">Remove</span>
            </Button>
          </PanelToolbar>
        )}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
          <RosterTable
            config={config}
            columns={columns}
            rows={rows}
            sort={sort}
            dir={dir}
            onSort={handleSort}
            selectedIds={selectedIds}
            onSelectedChange={setSelectedIds}
            onOpenEntry={openEntry}
            stale={rosterQuery.isPlaceholderData}
            empty={empty}
            scrollRef={scrollRef}
            // A new search, filter, sort or event starts again from the top.
            resetKey={viewKey}
            hasMore={
              rosterQuery.hasNextPage && !rosterQuery.isFetchNextPageError
            }
            loadingMore={rosterQuery.isFetchingNextPage}
            onLoadMore={() => void fetchNextPage()}
          />
        </div>
      </Panel>

      <RosterDetailSheet
        entry={liveSheetEntry}
        orgSlug={orgSlug}
        eventId={eventId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        checkInEnabled={checkInEnabled}
        freeTierEnabled={isDancers ? freeTierEnabled : undefined}
      />

      <CsvUploadDialog
        orgSlug={orgSlug}
        eventId={eventId}
        type={type}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />

      {isDancers && checkInEnabled && (
        <ResetCheckInDialog
          open={resetOpen}
          onOpenChange={setResetOpen}
          eventName={eventName}
          checkedInCount={stats?.checkedIn ?? 0}
          isPending={resetCheckInMutation.isPending}
          onConfirm={handleResetCheckIn}
        />
      )}

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogPopup>
          <DialogHeader className="pb-(--space-16)">
            <DialogTitle>
              Remove {countLabel(selected.length, config)}?
            </DialogTitle>
            <DialogDescription>
              They come off the {eventName} roster. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" size="lg" />}>
              Cancel
            </DialogClose>
            <Button
              variant="danger"
              size="lg"
              onClick={handleRemove}
              disabled={deleteMutation.isPending || selected.length === 0}
            >
              <Icon icon={TrashIcon} />
              Remove
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </ShellPage>
  );
}

function emptyText(
  config: RosterKindConfig,
  status: RosterStatusFilter,
  q: string | undefined,
) {
  if (q) return `No matches for “${q}”`;
  if (status === "pending") return `No pending ${config.plural}`;
  if (status === "active") return `No active ${config.plural}`;
  return `No ${config.plural} yet`;
}

/** Upload and Add as one joined control, then a "More" menu with export and reset. */
function RosterHeaderActions({
  config,
  onUpload,
  onExport,
  onResetCheckIn,
  checkedInCount,
  reconcile,
}: {
  config: RosterKindConfig;
  onUpload: () => void;
  onExport: () => void;
  onResetCheckIn?: () => void;
  checkedInCount: number;
  /** Coaches only: the link to Reconciliation, first in the row. */
  reconcile?: ReactNode;
}) {
  const joined =
    "hover:bg-surface-pressed data-pressed:bg-surface-pressed data-popup-open:bg-surface-pressed";
  return (
    <div className="flex items-center gap-(--space-6)">
      {reconcile}
      <Group className="shrink-0">
        <Button
          onClick={onUpload}
          className={`${joined} bp-small:w-(--control) bp-small:px-0`}
          label="Upload"
        >
          <Icon icon={UploadSimpleIcon} />
          <span className="bp-small:hidden">Upload</span>
        </Button>
        <GroupSeparator className="bg-line-control" />
        <Button
          className={joined}
          onClick={() =>
            // No endpoint adds a single Roster Entry yet.
            toastManager.add({
              title: `Adding one ${config.singular} is coming soon`,
              type: "info",
            })
          }
        >
          <Icon icon={PlusIcon} />
          Add
        </Button>
      </Group>
      <Menu>
        <MenuTrigger
          render={<Button iconOnly label={`More ${config.singular} actions`} />}
        >
          <Icon icon={DotsThreeIcon} />
        </MenuTrigger>
        <MenuPopup align="end" className="min-w-[200px]">
          <MenuItem icon={DownloadSimpleIcon} onClick={onExport}>
            Export CSV
          </MenuItem>
          {onResetCheckIn && (
            <>
              <MenuSeparator />
              <MenuItem
                icon={ArrowCounterClockwiseIcon}
                variant="danger"
                hint={checkedInCount}
                disabled={checkedInCount === 0}
                onClick={onResetCheckIn}
              >
                Reset check-in
              </MenuItem>
            </>
          )}
        </MenuPopup>
      </Menu>
    </div>
  );
}
