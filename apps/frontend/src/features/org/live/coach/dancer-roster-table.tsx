import { NotePencilIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode, type RefObject } from "react";

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
import { IconToggle } from "@/components/event/pill-toggle";
import { Rating } from "@/components/event/rating";
import { Textarea } from "@/components/event/textarea";
import { cn } from "@/components/utils/cn";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerBib } from "@/features/org/live/shared/dancer-bib";
import { PersonAvatar } from "@/features/org/live/shared/person-avatar";
import { useVirtualRows } from "@/features/org/live/shared/use-virtual-rows";
import { Spacer } from "@/features/org/live/shared/virtual-spacer";

import {
  dancerName,
  type ScoutedDancer,
  type useCoachScouting,
} from "./coach-scouting";
import type { RosterSort, RosterSortKey } from "./roster-order";
import { CallToggle, FavoriteToggle, NoteFillIcon } from "./scouting-controls";

type Scouting = ReturnType<typeof useCoachScouting>;

const hideOnPhone = "bp-phone:hidden";

/** Clicks on these inside a row act on themselves, not the row. */
const INTERACTIVE =
  "button, a, input, textarea, label, [role=checkbox], [role=radio]";

export interface DancerRosterTableProps {
  rows: ScoutedDancer[];
  scouting: Scouting;
  sort: RosterSort;
  onSort: (key: RosterSortKey) => void;
  selectedIds: ReadonlySet<string>;
  onSelectedChange: (ids: Set<string>) => void;
  /** Opens the dancer sheet. */
  onOpenDancer: (rosterId: string) => void;
  /** The event the marks belong to; `undefined` for all events. */
  eventId?: string;
  /** Shown as the only body row when `rows` is empty. */
  empty: ReactNode;
  /**
   * The box the table scrolls in from the desk breakpoint up. At phone width
   * the page itself scrolls, so the rows follow the window instead.
   */
  scrollRef: RefObject<HTMLElement | null>;
  /** More rows wait on the server; `onLoadMore` fetches the next page. */
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

/**
 * The coach's roster: bib, name, year, studio, GPA, then their rating,
 * favorite, callback and note on each dancer. A row opens the dancer sheet, a bib the
 * dancer dialog, the note icon a private-note panel under the row. Dancers
 * from another event (the "All events" view, or before her event) are read-only.
 */
export function DancerRosterTable({
  rows,
  scouting,
  sort,
  onSort,
  selectedIds,
  onSelectedChange,
  onOpenDancer,
  eventId,
  empty,
  scrollRef,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: DancerRosterTableProps) {
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [table, setTable] = useState<HTMLDivElement | null>(null);
  const virtual = useVirtualRows({
    count: rows.length,
    scrollRef,
    list: table,
    hasMore,
    loadingMore,
    onLoadMore,
  });
  const showCall = scouting.callbacksEnabled;
  const selectable = rows.filter((row) => scouting.canScoutDancer(row));
  const selectedCount = selectable.filter((row) =>
    selectedIds.has(row.rosterId),
  ).length;
  const allSelected =
    selectable.length > 0 && selectedCount === selectable.length;

  const columns = [
    "16px 48px minmax(130px,1.4fr) 52px minmax(120px,1fr) 44px 112px 28px",
    showCall ? "96px" : "",
    "32px",
  ]
    .filter(Boolean)
    .join(" ");
  const phoneColumns = [
    "36px minmax(88px,1fr) 76px 28px",
    showCall ? "32px" : "",
    "28px",
  ]
    .filter(Boolean)
    .join(" ");

  const header = (key: RosterSortKey, label: string, className?: string) => (
    <DataTableHeaderCell
      className={className}
      sortDirection={sort.key === key ? sort.dir : null}
      onSort={() => onSort(key)}
    >
      {label}
    </DataTableHeaderCell>
  );

  const toggleRow = (rosterId: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(rosterId);
    else next.delete(rosterId);
    onSelectedChange(next);
  };

  return (
    <DataTable
      ref={setTable}
      columns={columns}
      phoneColumns={phoneColumns}
      aria-label="Dancers"
      className="bp-phone:min-w-[348px] min-w-[840px]"
    >
      <DataTableHead>
        <DataTableSelectCell
          header
          className={hideOnPhone}
          label="Select all"
          checked={allSelected}
          indeterminate={selectedCount > 0 && !allSelected}
          disabled={selectable.length === 0}
          onCheckedChange={(checked) =>
            onSelectedChange(
              checked
                ? new Set(selectable.map((row) => row.rosterId))
                : new Set(),
            )
          }
        />
        {header("bib", "Bib")}
        {header("name", "Name")}
        {header("year", "Year", hideOnPhone)}
        {header("studio", "Studio", hideOnPhone)}
        {header("gpa", "GPA", hideOnPhone)}
        {header("rating", "Rating")}
        <DataTableHeaderCell aria-label="Favorite" />
        {showCall && (
          <DataTableHeaderCell>
            {/* The 32px phone column can't fit the word; the icon pills say it. */}
            <span className="bp-phone:sr-only">Callback</span>
          </DataTableHeaderCell>
        )}
        <DataTableHeaderCell aria-label="Note" />
      </DataTableHead>
      <DataTableBody>
        {rows.length === 0 ? (
          empty
        ) : (
          <>
            <Spacer height={virtual.padTop} />
            {virtual.items.map((item) => {
              const row = rows[item.index]!;
              return (
                // Measured as one item, so an open note panel counts too.
                <div
                  key={row.rosterId}
                  ref={virtual.measure}
                  data-index={item.index}
                  role="none"
                  className={cn(
                    "col-span-full grid grid-cols-subgrid",
                    // The container's own border closes the table, so the
                    // last loaded row drops its divider.
                    !hasMore &&
                      item.index === rows.length - 1 &&
                      "[&>[role=row]]:border-b-0",
                  )}
                >
                  <RosterRow
                    row={row}
                    scouting={scouting}
                    eventId={eventId}
                    selected={selectedIds.has(row.rosterId)}
                    onSelect={(checked) => toggleRow(row.rosterId, checked)}
                    noteOpen={noteFor === row.rosterId}
                    onToggleNote={() =>
                      setNoteFor((current) =>
                        current === row.rosterId ? null : row.rosterId,
                      )
                    }
                    onOpenDancer={onOpenDancer}
                  />
                </div>
              );
            })}
            <Spacer height={virtual.padBottom} />
            {loadingMore && (
              <div
                role="row"
                className="text-fg-3 type-meta col-span-full py-(--space-12) text-center"
              >
                <span role="cell">Loading more dancers…</span>
              </div>
            )}
          </>
        )}
      </DataTableBody>
    </DataTable>
  );
}

function RosterRow({
  row,
  scouting,
  eventId,
  selected,
  onSelect,
  noteOpen,
  onToggleNote,
  onOpenDancer,
}: {
  row: ScoutedDancer;
  scouting: Scouting;
  eventId?: string;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  noteOpen: boolean;
  onToggleNote: () => void;
  onOpenDancer: (rosterId: string) => void;
}) {
  const name = dancerName(row);
  const editable = scouting.canScoutDancer(row);

  return (
    <>
      <DataTableRow
        selected={selected}
        data-testid="coach-dancer-row"
        className={cn(
          "cursor-pointer",
          noteOpen && "bg-surface-hover border-b-transparent",
        )}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
          onOpenDancer(row.rosterId);
        }}
      >
        <DataTableSelectCell
          className={hideOnPhone}
          label={`Select ${name}`}
          checked={selected}
          disabled={!editable}
          onCheckedChange={onSelect}
        />
        <DataTableCell kind="mono">
          <DancerBib
            dancer={row}
            onViewProfile={() => onOpenDancer(row.rosterId)}
          />
        </DataTableCell>
        {/* `text`, not `strong`: a truncating cell would clip the button's focus ring. */}
        <DataTableCell
          kind="text"
          className="flex min-w-0 items-center gap-(--space-8)"
        >
          <PersonAvatar
            firstName={row.firstName}
            lastName={row.lastName}
            src={row.profilePhotoUrl}
            className="size-6"
          />
          <button
            type="button"
            onClick={() => onOpenDancer(row.rosterId)}
            className="text-fg s2s-focus min-w-0 cursor-pointer truncate rounded-(--radius-4) text-left font-medium underline-offset-2 hover:underline"
          >
            {name}
          </button>
        </DataTableCell>
        <DataTableCell
          kind="num"
          className={cn(hideOnPhone, "text-fg-2 text-left")}
        >
          {row.gradYear ?? "–"}
        </DataTableCell>
        <DataTableCell kind="dim" className={hideOnPhone}>
          {row.studio ?? "–"}
        </DataTableCell>
        <DataTableCell
          kind="num"
          className={cn(hideOnPhone, "text-fg-2 text-left")}
        >
          {row.gpa != null ? row.gpa.toFixed(1) : "–"}
        </DataTableCell>
        <DataTableCell>
          <Rating
            label={name}
            value={row.rating ?? 0}
            max={scouting.ratingMax}
            readOnly={!editable}
            onValueChange={(value) => scouting.rate(row.rosterId, value)}
          />
        </DataTableCell>
        <DataTableCell>
          <FavoriteToggle
            name={name}
            pressed={row.isFavorited}
            disabled={!editable}
            onChange={() => void scouting.toggleFavorite(row)}
          />
        </DataTableCell>
        {scouting.callbacksEnabled && (
          <DataTableCell>
            <CallToggle
              name={name}
              pressed={row.isCalledBack}
              disabled={!editable}
              onChange={() => void scouting.toggleCallback(row)}
            />
          </DataTableCell>
        )}
        <DataTableCell>
          <IconToggle
            label={`${row.hasNote ? "Edit" : "Add"} note for ${name}`}
            icon={NotePencilIcon}
            pressedIcon={row.hasNote ? NoteFillIcon : NotePencilIcon}
            has={row.hasNote}
            pressed={noteOpen}
            aria-expanded={noteOpen}
            onChange={onToggleNote}
          />
        </DataTableCell>
      </DataTableRow>
      {noteOpen && (
        <NotePanel
          row={row}
          name={name}
          editable={editable}
          eventId={eventId}
          scouting={scouting}
          onDone={onToggleNote}
        />
      )}
    </>
  );
}

/** "Private note · NAME" under the row; Done saves (an emptied note is deleted). */
function NotePanel({
  row,
  name,
  editable,
  eventId,
  scouting,
  onDone,
}: {
  row: ScoutedDancer;
  name: string;
  editable: boolean;
  eventId?: string;
  scouting: Scouting;
  onDone: () => void;
}) {
  const { data: detail, isPending } = useQuery({
    ...scoutingQueries.dancer(
      scouting.slug,
      row.rosterId,
      eventId ?? row.eventId,
    ),
    enabled: row.hasNote,
  });
  const saved = row.hasNote ? (detail?.note ?? "") : "";
  const loading = row.hasNote && isPending;
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? saved;
  const id = `note-${row.rosterId}`;

  const done = async () => {
    if (editable && draft !== null && draft.trim() !== saved.trim()) {
      const ok = await scouting.saveNote(row.rosterId, draft);
      if (!ok) return;
    }
    onDone();
  };

  return (
    <div
      role="row"
      className="bg-surface-hover border-line-soft bp-phone:ps-[56px] col-span-full -mx-(--dt-pad) flex flex-col gap-(--space-8) border-b ps-[102px] pe-(--dt-pad) pt-[2px] pb-(--space-14)"
    >
      <div role="cell" className="flex flex-col gap-(--space-8)">
        <label htmlFor={id} className="type-label text-fg-3">
          Private note · {name}
        </label>
        <Textarea
          id={id}
          autoFocus={editable}
          placeholder={
            loading ? "Loading…" : editable ? "Add a note…" : "No note"
          }
          value={value}
          readOnly={!editable}
          disabled={loading}
          onChange={(event) => setDraft(event.target.value)}
        />
        <span className="flex gap-(--space-8)">
          <Button onClick={() => void done()} disabled={scouting.savingNote}>
            Done
          </Button>
        </span>
      </div>
    </div>
  );
}
