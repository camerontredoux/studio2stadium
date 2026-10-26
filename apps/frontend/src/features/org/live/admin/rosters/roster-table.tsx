import { CheckIcon } from "@phosphor-icons/react";
import type * as React from "react";

import { Button } from "@/components/event/button";
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
import { cn } from "@/components/utils/cn";
import { formatClock } from "@/features/org/lib/event-clock";
import { useEventTimeZone } from "@/features/org/live/shared/use-event-time-zone";
import type { RosterEntry } from "@/features/org/api/roster-queries";
import { DancerBib } from "@/features/org/live/shared/dancer-bib";

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
  /** The "Show more" row under the last loaded row. */
  footer?: React.ReactNode;
  /** Dims the rows while a new filter's results load. */
  stale?: boolean;
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
  footer,
  stale = false,
}: RosterTableProps) {
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
          stale && "[&>[role=row]]:opacity-60",
          "[&>[role=row]]:transition-opacity",
        )}
      >
        {rows.length === 0
          ? empty
          : rows.map((row) => {
              const name = fullName(row);
              const selected = selectedIds.has(row.id);
              return (
                <DataTableRow
                  key={row.id}
                  selected={selected}
                  data-testid="roster-row"
                >
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
              );
            })}
        {rows.length > 0 && footer}
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
        <DataTableCell kind="text" className={phone}>
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
        <DataTableCell
          kind="status"
          className={cn(row.isRegistered ? "text-fg" : "text-fg-3", phone)}
        >
          {row.isRegistered ? "Active" : "Pending"}
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

/** The row under the last loaded row: loads the next page. */
export function RosterShowMore({
  loaded,
  total,
  loading,
  onClick,
}: {
  loaded: number;
  total: number;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div role="row" className="col-span-full">
      <div
        role="cell"
        className="flex items-center justify-center gap-(--space-10) px-(--space-14) py-(--space-10)"
      >
        <Button variant="ghost" onClick={onClick} disabled={loading}>
          {loading ? "Loading…" : "Show more"}
        </Button>
        <span className="type-data-sm text-fg-3">
          {loaded} of {total}
        </span>
      </div>
    </div>
  );
}
