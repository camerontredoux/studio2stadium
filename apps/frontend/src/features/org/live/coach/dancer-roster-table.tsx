import {
  HeartIcon,
  MegaphoneSimpleIcon,
  NotePencilIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode, type RefObject } from "react";

import { Button } from "@/components/event/button";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DataTableSelectCell,
} from "@/components/event/data-table";
import { Icon } from "@/components/event/icon";
import { IconToggle } from "@/components/event/pill-toggle";
import { Rating } from "@/components/event/rating";
import { Textarea } from "@/components/event/textarea";
import { cn } from "@/components/utils/cn";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { PersonAvatar } from "@/features/org/live/shared/person-avatar";
import { DancerBib } from "@/features/org/live/shared/dancer-bib";
import { useVirtualRows } from "@/features/org/live/shared/use-virtual-rows";
import { Spacer } from "@/features/org/live/shared/virtual-spacer";

import {
  dancerName,
  type ScoutedDancer,
  type useCoachScouting,
} from "./coach-scouting";
import type { RosterLayout } from "./roster-layout";
import type { RosterSort, RosterSortKey } from "./roster-order";
import { CallToggle, FavoriteToggle, NoteFillIcon } from "./scouting-controls";

type Scouting = ReturnType<typeof useCoachScouting>;

/** Clicks on these inside a row act on themselves, not the row. */
const INTERACTIVE =
  "button, a, input, textarea, label, [role=checkbox], [role=radio]";

/** The text and optional action shown in place of the rows when there are none. */
export type RosterEmpty = { text: ReactNode; action?: ReactNode };

type RosterListProps = {
  rows: ScoutedDancer[];
  scouting: Scouting;
  /** Opens the dancer sheet. */
  onOpenDancer: (rosterId: string) => void;
  empty: RosterEmpty;
  /**
   * The box the list scrolls in from the desk breakpoint up. At phone width
   * the page itself scrolls, so the rows follow the window instead.
   */
  scrollRef: RefObject<HTMLElement | null>;
  /** A change starts the list again from the top. */
  resetKey?: unknown;
  /** More rows wait on the server; `onLoadMore` fetches the next page. */
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
};

export interface DancerRosterTableProps extends RosterListProps {
  layout: RosterLayout;
  sort: RosterSort;
  onSort: (key: RosterSortKey) => void;
  selectedIds: ReadonlySet<string>;
  onSelectedChange: (ids: Set<string>) => void;
  /** The event the marks belong to; `undefined` for all events. */
  eventId?: string;
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
  layout,
  sort,
  onSort,
  selectedIds,
  onSelectedChange,
  onOpenDancer,
  eventId,
  empty,
  scrollRef,
  resetKey,
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
    resetKey,
  });
  const showCall = scouting.callbacksEnabled;
  const selectable = rows.filter((row) => scouting.canScoutDancer(row));
  const selectedCount = selectable.filter((row) =>
    selectedIds.has(row.rosterId),
  ).length;
  const allSelected =
    selectable.length > 0 && selectedCount === selectable.length;

  // One template at every window width: the roster's own width picks the columns.
  const columns = [
    "16px 44px minmax(110px,1.4fr)",
    layout.year ? "48px" : "",
    layout.studio ? "minmax(120px,1fr)" : "",
    "36px 96px 28px",
    showCall ? (layout.callLabel ? "max-content" : "32px") : "",
    "28px",
  ]
    .filter(Boolean)
    .join(" ");

  const header = (key: RosterSortKey, label: string) => (
    <DataTableHeaderCell
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
      phoneColumns={columns}
      aria-label="Dancers"
    >
      <DataTableHead>
        <DataTableSelectCell
          header
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
        {layout.year && header("year", "Year")}
        {layout.studio && header("studio", "Studio")}
        {header("gpa", "GPA")}
        {header("rating", "Rating")}
        <DataTableHeaderCell aria-label="Favorite" className="justify-center">
          <Icon icon={HeartIcon} />
        </DataTableHeaderCell>
        {showCall && (
          <DataTableHeaderCell
            aria-label={layout.callLabel ? undefined : "Callback"}
            className={cn(!layout.callLabel && "justify-center")}
          >
            {layout.callLabel ? "Callback" : <Icon icon={MegaphoneSimpleIcon} />}
          </DataTableHeaderCell>
        )}
        <DataTableHeaderCell aria-label="Note" className="justify-center">
          <Icon icon={NotePencilIcon} />
        </DataTableHeaderCell>
      </DataTableHead>
      <DataTableBody>
        {rows.length === 0 ? (
          <DataTableEmpty action={empty.action}>{empty.text}</DataTableEmpty>
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
                    virtual.isLast(item.index) && "[&>[role=row]]:border-b-0",
                  )}
                >
                  <RosterRow
                    row={row}
                    scouting={scouting}
                    layout={layout}
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
  layout,
  eventId,
  selected,
  onSelect,
  noteOpen,
  onToggleNote,
  onOpenDancer,
}: {
  row: ScoutedDancer;
  scouting: Scouting;
  layout: RosterLayout;
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
          "min-h-12 cursor-pointer",
          noteOpen && "bg-surface-hover border-b-transparent",
        )}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
          onOpenDancer(row.rosterId);
        }}
      >
        <DataTableSelectCell
          label={`Select ${name}`}
          checked={selected}
          disabled={!editable}
          onCheckedChange={onSelect}
        />
        <DataTableCell kind="mono">
          <DancerBib
            dancer={row}
            onViewProfile={() => onOpenDancer(row.rosterId)}
            className="text-fg-3"
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
        {layout.year && (
          <DataTableCell kind="num" className="text-fg-2 text-left">
            {row.gradYear ?? "–"}
          </DataTableCell>
        )}
        {layout.studio && (
          <DataTableCell kind="dim">{row.studio ?? "–"}</DataTableCell>
        )}
        <DataTableCell kind="num" className="text-fg-2 text-left">
          {row.gpa != null ? row.gpa.toFixed(1) : "–"}
        </DataTableCell>
        <DataTableCell>
          <Rating
            label={name}
            value={row.rating ?? 0}
            max={scouting.ratingMax}
            hideValue
            readOnly={!editable}
            onValueChange={(value) => scouting.rate(row.rosterId, value)}
          />
        </DataTableCell>
        <DataTableCell className="flex justify-center">
          <FavoriteToggle
            name={name}
            pressed={row.isFavorited}
            disabled={!editable}
            onChange={() => void scouting.toggleFavorite(row)}
          />
        </DataTableCell>
        {scouting.callbacksEnabled && (
          <DataTableCell className="flex justify-center">
            <CallToggle
              name={name}
              pressed={row.isCalledBack}
              disabled={!editable}
              compact={false}
              iconOnly={!layout.callLabel}
              idleLabel="Call back"
              className="border-line-control h-8 rounded-full sm:h-8"
              onChange={() => void scouting.toggleCallback(row)}
            />
          </DataTableCell>
        )}
        <DataTableCell className="flex justify-center">
          <IconToggle
            label={`${row.hasNote ? "Edit" : "Add"} note for ${name}`}
            icon={row.hasNote ? NotePencilIcon : PlusIcon}
            pressedIcon={row.hasNote ? NoteFillIcon : PlusIcon}
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
      className="bg-surface-hover border-line-soft col-span-full -mx-(--dt-pad) flex flex-col gap-(--space-8) border-b ps-[88px] pe-(--dt-pad) pt-[2px] pb-(--space-14)"
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

/**
 * The roster as cards, for a roster narrower than the table fits: each dancer
 * shows a bib label over the name, the callback pill at the right, and below a
 * strip of tappable stars and the heart. A card opens the dancer sheet, where
 * the note lives at this width.
 */
export function DancerRosterCards({
  rows,
  scouting,
  onOpenDancer,
  empty,
  scrollRef,
  resetKey,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: RosterListProps) {
  const [list, setList] = useState<HTMLDivElement | null>(null);
  const virtual = useVirtualRows({
    count: rows.length,
    scrollRef,
    list,
    estimate: 120,
    hasMore,
    loadingMore,
    onLoadMore,
    resetKey,
  });

  if (rows.length === 0) {
    return (
      <div className="text-fg-3 flex items-center justify-center gap-(--space-10) px-(--space-14) py-[28px]">
        <span>{empty.text}</span>
        {empty.action}
      </div>
    );
  }

  return (
    <div ref={setList} role="list" aria-label="Dancers">
      <Spacer height={virtual.padTop} />
      {virtual.items.map((item) => {
        const row = rows[item.index]!;
        return (
          <div
            key={row.rosterId}
            ref={virtual.measure}
            data-index={item.index}
            role="listitem"
            className={cn(
              "border-line-soft border-b",
              virtual.isLast(item.index) && "border-b-0",
            )}
          >
            <RosterCard
              row={row}
              scouting={scouting}
              onOpenDancer={onOpenDancer}
            />
          </div>
        );
      })}
      <Spacer height={virtual.padBottom} />
      {loadingMore && (
        <p className="text-fg-3 type-meta m-0 py-(--space-12) text-center">
          Loading more dancers…
        </p>
      )}
    </div>
  );
}

function RosterCard({
  row,
  scouting,
  onOpenDancer,
}: {
  row: ScoutedDancer;
  scouting: Scouting;
  onOpenDancer: (rosterId: string) => void;
}) {
  const name = dancerName(row);
  const editable = scouting.canScoutDancer(row);

  return (
    <div
      data-testid="coach-dancer-card"
      className="flex cursor-pointer flex-col gap-(--space-10) px-(--space-12) pt-(--space-14) pb-(--space-12)"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
        onOpenDancer(row.rosterId);
      }}
    >
      <div className="flex items-center gap-(--space-12) ps-(--space-4)">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-(--space-2)">
          <DancerBib
            dancer={row}
            onViewProfile={() => onOpenDancer(row.rosterId)}
            className="text-fg-3 h-auto py-px text-[11px] tracking-[0.06em]"
          >
            Bib {row.bibNumber ?? "–"}
          </DancerBib>
          <button
            type="button"
            onClick={() => onOpenDancer(row.rosterId)}
            className="text-fg s2s-focus max-w-full min-w-0 cursor-pointer truncate rounded-(--radius-4) text-left text-[15px] font-normal underline-offset-2 hover:underline"
          >
            {name}
          </button>
        </div>
        {scouting.callbacksEnabled && (
          <CallToggle
            name={name}
            pressed={row.isCalledBack}
            disabled={!editable}
            compact={false}
            idleLabel="Call back"
            className="border-line-control h-[30px] px-(--space-12) text-[13px] sm:h-[30px] sm:text-[13px]"
            onChange={() => void scouting.toggleCallback(row)}
          />
        )}
      </div>
      <div className="bg-bg-150 border-line-soft flex items-center justify-between rounded-(--radius-8) border px-(--space-2)">
        <Rating
          size="lg"
          label={name}
          value={row.rating ?? 0}
          max={scouting.ratingMax}
          hideValue
          readOnly={!editable}
          onValueChange={(value) => scouting.rate(row.rosterId, value)}
        />
        <FavoriteToggle
          size="lg"
          name={name}
          pressed={row.isFavorited}
          disabled={!editable}
          onChange={() => void scouting.toggleFavorite(row)}
        />
      </div>
    </div>
  );
}
