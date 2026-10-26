import { CheckIcon } from "@phosphor-icons/react";
import { type RefObject, useState } from "react";
import type * as React from "react";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DataTableSelectCell,
} from "@/components/event/data-table";
import { Icon } from "@/components/event/icon";
import { Tag } from "@/components/event/tag";
import { cn } from "@/components/utils/cn";
import { formatClock } from "@/features/org/lib/event-clock";
import { useEventTimeZone } from "@/features/org/live/shared/use-event-time-zone";
import type { RosterEntry } from "@/features/org/api/roster-queries";
import { DancerBib } from "@/features/org/live/shared/dancer-bib";
import { PersonAvatar } from "@/features/org/live/shared/person-avatar";
import { useVirtualRows } from "@/features/org/live/shared/use-virtual-rows";
import { Spacer } from "@/features/org/live/shared/virtual-spacer";

import {
  fullName,
  gridTemplates,
  type RosterColumn,
  type RosterKindConfig,
  type RosterSortDir,
  type RosterSortKey,
} from "./roster-config";

export interface RosterTableProps {
  config: RosterKindConfig;
  columns: RosterColumn[];
  rows: RosterEntry[];
  sort?: RosterSortKey;
  dir: RosterSortDir;
  onSort: (key: RosterSortKey) => void;
  selectedIds: ReadonlySet<string>;
  onSelectedChange: (ids: Set<string>) => void;
  /** Opens the roster detail sheet for a row. */
  onOpenEntry: (entry: RosterEntry) => void;
  /** Shown as the only body row when `rows` is empty (loading, error, no results). */
  empty?: React.ReactNode;
  /** Dims the rows while a new filter's results load. */
  stale?: boolean;
  /**
   * The box the table scrolls in from the desk breakpoint up. At phone width
   * the page itself scrolls, so the rows follow the window instead.
   */
  scrollRef: RefObject<HTMLElement | null>;
  /** A change starts the list again from the top. */
  resetKey?: unknown;
  /** More rows wait on the server; `onLoadMore` fetches the next page. */
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

const hideOnPhone = "bp-phone:hidden";

/** The roster's DataTable: sortable headers, selection, and the name button that opens the sheet. */
export function RosterTable({
  config,
  columns,
  rows,
  sort,
  dir,
  onSort,
  selectedIds,
  onSelectedChange,
  onOpenEntry,
  empty,
  stale = false,
  scrollRef,
  resetKey,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: RosterTableProps) {
  const [table, setTable] = useState<HTMLDivElement | null>(null);
  const virtual = useVirtualRows({
    count: rows.length,
    scrollRef,
    list: table,
    hasMore,
    loadingMore,
    onLoadMore,
    resetKey,
  });
  const templates = gridTemplates(columns);
  const timeZone = useEventTimeZone();
  const selectedCount = rows.filter((r) => selectedIds.has(r.id)).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;

  const toggleRow = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectedChange(next);
  };

  return (
    <DataTable
      ref={setTable}
      columns={templates.columns}
      phoneColumns={templates.phoneColumns}
      selectable
      aria-label={config.title}
      aria-busy={stale || undefined}
      className={config.minWidth}
    >
      <DataTableHead>
        <DataTableSelectCell
          header
          label="Select all"
          checked={allSelected}
          indeterminate={selectedCount > 0 && !allSelected}
          disabled={rows.length === 0}
          onCheckedChange={(checked) =>
            onSelectedChange(
              checked ? new Set(rows.map((r) => r.id)) : new Set(),
            )
          }
        />
        {columns.map((column) => (
          <DataTableHeaderCell
            key={column.id}
            className={cn(!column.phoneWidth && hideOnPhone)}
            sortDirection={
              column.sortKey
                ? sort === column.sortKey
                  ? dir
                  : null
                : undefined
            }
            onSort={
              column.sortKey
                ? () => onSort(column.sortKey as RosterSortKey)
                : undefined
            }
          >
            {column.label}
          </DataTableHeaderCell>
        ))}
      </DataTableHead>
      <DataTableBody
        className={cn(
          stale && "[&_[role=row]]:opacity-60",
          "[&_[role=row]]:transition-opacity",
        )}
      >
        {rows.length === 0 ? (
          empty
        ) : (
          <>
            <Spacer height={virtual.padTop} />
            {virtual.items.map((item) => {
              const row = rows[item.index]!;
              const name = fullName(row);
              const selected = selectedIds.has(row.id);
              return (
                <div
                  key={row.id}
                  ref={virtual.measure}
                  data-index={item.index}
                  role="none"
                  className={cn(
                    "col-span-full grid grid-cols-subgrid",
                    virtual.isLast(item.index) && "[&>[role=row]]:border-b-0",
                  )}
                >
                  <DataTableRow selected={selected} data-testid="roster-row">
                    <DataTableSelectCell
                      label={`Select ${name}`}
                      checked={selected}
                      onCheckedChange={(checked) => toggleRow(row.id, checked)}
                    />
                    {columns.map((column) => (
                      <RosterCell
                        key={column.id}
                        column={column}
                        row={row}
                        onOpenEntry={onOpenEntry}
                        timeZone={timeZone}
                      />
                    ))}
                  </DataTableRow>
                </div>
              );
            })}
            <Spacer height={virtual.padBottom} />
            {loadingMore && (
              <div
                role="row"
                className="text-fg-3 type-meta col-span-full py-(--space-12) text-center"
              >
                <span role="cell">Loading more {config.plural}…</span>
              </div>
            )}
          </>
        )}
      </DataTableBody>
    </DataTable>
  );
}

function RosterCell({
  column,
  row,
  onOpenEntry,
  timeZone,
}: {
  column: RosterColumn;
  row: RosterEntry;
  onOpenEntry: (entry: RosterEntry) => void;
  /** The event's zone, for the check-in time. */
  timeZone: string | null;
}) {
  const phone = cn(!column.phoneWidth && hideOnPhone);

  switch (column.id) {
    case "bib":
      return (
        <DataTableCell kind="mono" className={phone}>
          <DancerBib
            dancer={{
              rosterId: row.id,
              eventId: row.eventId,
              bibNumber: row.bibNumber,
              firstName: row.firstName,
              lastName: row.lastName,
              email: row.email,
              checkedInAt: row.checkedInAt,
              isRegistered: row.isRegistered,
              studio: row.profile?.studio,
              gradYear: row.profile?.gradYear,
              gpa: row.profile?.gpa,
              state: row.profile?.state,
              height: row.profile?.height,
              danceStyles: row.profile?.danceStyles,
              profilePhotoUrl: row.profile?.profilePhotoUrl,
            }}
            onViewProfile={() => onOpenEntry(row)}
          />
        </DataTableCell>
      );
    case "name":
      // `text`, not `strong`: a truncating cell would clip the button's focus ring.
      return (
        <DataTableCell
          kind="text"
          className={cn(phone, "flex min-w-0 items-center gap-(--space-8)")}
        >
          <PersonAvatar
            firstName={row.firstName}
            lastName={row.lastName}
            src={row.profile?.profilePhotoUrl ?? row.linkedUser?.avatarUrl}
            className="size-6"
          />
          <button
            type="button"
            onClick={() => onOpenEntry(row)}
            className={cn(
              "text-fg s2s-focus max-w-full cursor-pointer truncate rounded-(--radius-4) border-0 bg-transparent p-0 py-1 text-left align-middle font-medium",
              "decoration-fg-3 underline-offset-4 hover:underline focus-visible:underline",
            )}
          >
            {fullName(row)}
          </button>
        </DataTableCell>
      );
    case "email":
      return (
        <DataTableCell kind="dim" className={phone} title={row.email}>
          {row.email}
        </DataTableCell>
      );
    case "school":
      return (
        <DataTableCell
          className={cn(
            "truncate",
            row.organization ? "text-fg" : "text-fg-3",
            phone,
          )}
          title={row.organization ?? undefined}
        >
          {row.organization ?? "—"}
        </DataTableCell>
      );
    case "status":
      return (
        <DataTableCell kind="status" className={phone}>
          <Tag tone={row.isRegistered ? "live" : "muted"}>
            {row.isRegistered ? "Active" : "Pending"}
          </Tag>
        </DataTableCell>
      );
    case "paid":
      return (
        <DataTableCell
          kind="status"
          className={cn(row.paid ? "text-fg" : "text-fg-3", phone)}
        >
          {row.paid == null ? "—" : row.paid ? "Paid" : "Unpaid"}
        </DataTableCell>
      );
    case "checkedIn":
      return (
        <DataTableCell
          className={cn("flex items-center gap-(--space-6)", phone)}
          title={
            row.checkedInAt
              ? `Checked in ${formatClock(row.checkedInAt, timeZone)}`
              : undefined
          }
        >
          {row.checkedInAt ? (
            <>
              <Icon icon={CheckIcon} />
              <span>Yes</span>
            </>
          ) : (
            <span className="text-fg-3">No</span>
          )}
        </DataTableCell>
      );
  }
}
