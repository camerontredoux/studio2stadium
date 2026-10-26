import {
  ListBulletsIcon,
  MegaphoneIcon,
  PlusIcon,
  StarIcon,
} from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/event/button";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/event/data-table";
import { Icon } from "@/components/event/icon";
import { Panel, PanelToolbar } from "@/components/event/panel";
import { PillToggle } from "@/components/event/pill-toggle";
import { Search } from "@/components/event/search";
import { Segmented } from "@/components/event/segmented";
import { Tag } from "@/components/event/tag";
import { cn } from "@/components/utils/cn";
import { SubpageHeader } from "@/features/org/live/shared/event-header";
import { PersonAvatar } from "@/features/org/live/shared/person-avatar";
import { ShellPage } from "@/features/org/live/shared/shell-slots";
import { useActiveOrgEvent } from "@/features/org/live/shared/use-active-org-event";

import {
  buildCoachRows,
  coachFilterCounts,
  filterCoachRows,
  showcaseText,
  sortCoachRows,
  UNLIMITED_SELECTIONS,
  type CoachFilter,
  type CoachRow,
  type CoachSortKey,
  type SortDir,
} from "./dancer-scouting";
import { choiceHint } from "./top-choice-copy";
import {
  isPendingSelection,
  useDancerScouting,
  type DancerScouting,
} from "./use-dancer-scouting";

const DASHBOARD = "/o/$orgSlug/dancer/event-info";

/** The dancer's Coaches page: every school at the event, its callback and the dancer's top-choice pick. */
export function DancerCoachesPage() {
  const { event, roster } = useActiveOrgEvent();
  const scouting = useDancerScouting(event, roster);

  return (
    <ShellPage
      header={
        <SubpageHeader
          event={event}
          title="Coaches"
          dashboardTo={DASHBOARD}
          showStatus
        />
      }
    >
      {event ? (
        <CoachesPanel scouting={scouting} />
      ) : (
        <Panel className="text-fg-3 type-body items-center justify-center p-(--space-24)">
          No registered event.
        </Panel>
      )}
    </ShellPage>
  );
}

function CoachesPanel({ scouting }: { scouting: DancerScouting }) {
  const {
    schools,
    selections,
    callbacks,
    callbacksReleased,
    max,
    full,
    canEdit,
    selectionsOn,
    callbacksOn,
    schoolsQuery,
  } = scouting;
  const [filter, setFilter] = useState<CoachFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: CoachSortKey; dir: SortDir }>({
    key: "school",
    dir: "asc",
  });

  const allRows = buildCoachRows(schools, selections, callbacks);
  const counts = coachFilterCounts(allRows);
  const rows = sortCoachRows(
    filterCoachRows(allRows, filter, query),
    sort.key,
    sort.dir,
  );
  const clearFilters = () => {
    setFilter("all");
    setQuery("");
  };
  const toggleSort = (key: CoachSortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  const filterOptions = [
    {
      value: "all" as const,
      label: "All",
      icon: ListBulletsIcon,
      count: counts.all,
    },
    ...(selectionsOn
      ? [
          {
            value: "top" as const,
            label: "Top choices",
            icon: StarIcon,
            count: counts.top,
          },
        ]
      : []),
    ...(callbacksOn
      ? [
          {
            value: "called" as const,
            label: "Called you",
            icon: MegaphoneIcon,
            count: counts.called,
          },
        ]
      : []),
  ];

  const columns = [
    "minmax(170px,1.4fr)",
    "minmax(140px,1fr)",
    ...(callbacksOn ? ["160px"] : []),
    ...(selectionsOn ? ["112px"] : []),
  ].join(" ");
  const phoneColumns = [
    "minmax(0,1fr)",
    ...(callbacksOn ? ["104px"] : []),
    ...(selectionsOn ? ["76px"] : []),
  ].join(" ");
  const topLabel = max === UNLIMITED_SELECTIONS ? "Top choices" : `Top ${max}`;

  const empty = schoolsQuery.isPending ? (
    <DataTableEmpty>Loading coaches…</DataTableEmpty>
  ) : schoolsQuery.isError ? (
    <DataTableEmpty
      action={<Button onClick={() => schoolsQuery.refetch()}>Try again</Button>}
    >
      Couldn’t load coaches
    </DataTableEmpty>
  ) : allRows.length === 0 ? (
    <DataTableEmpty>No coaches have joined this event yet</DataTableEmpty>
  ) : (
    <DataTableEmpty
      action={<Button onClick={clearFilters}>Clear filters</Button>}
    >
      {emptyText(filter, query, callbacksReleased)}
    </DataTableEmpty>
  );

  return (
    <Panel
      aria-label="Coaches"
      className="desk:max-h-[calc(100vh-64px)]"
      data-testid="dancer-coaches"
    >
      <PanelToolbar>
        {filterOptions.length > 1 && (
          <Segmented
            label="Filter coaches"
            value={filter}
            onChange={setFilter}
            options={filterOptions}
          />
        )}
        <Search
          placeholder="Search"
          aria-label="Search coaches"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </PanelToolbar>
      <div className="desk:min-h-0 desk:flex-1 overflow-auto">
        <DataTable
          columns={columns}
          phoneColumns={phoneColumns}
          aria-label="Coaches"
          className="bp-phone:min-w-[320px] min-w-[620px]"
        >
          <DataTableHead>
            <DataTableHeaderCell
              sortDirection={sort.key === "school" ? sort.dir : null}
              onSort={() => toggleSort("school")}
            >
              School
            </DataTableHeaderCell>
            <DataTableHeaderCell
              className="bp-phone:hidden"
              sortDirection={sort.key === "coach" ? sort.dir : null}
              onSort={() => toggleSort("coach")}
            >
              Coach
            </DataTableHeaderCell>
            {callbacksOn && <DataTableHeaderCell>Callback</DataTableHeaderCell>}
            {selectionsOn && (
              <DataTableHeaderCell>{topLabel}</DataTableHeaderCell>
            )}
          </DataTableHead>
          <DataTableBody>
            {rows.length === 0
              ? empty
              : rows.map((row) => (
                  <CoachTableRow
                    key={row.school.rosterId}
                    row={row}
                    callbacksOn={callbacksOn}
                    selectionsOn={selectionsOn}
                    canEdit={canEdit}
                    full={full}
                    max={max}
                    onToggle={() =>
                      row.selection
                        ? scouting.remove(row.selection)
                        : scouting.add(row.school)
                    }
                  />
                ))}
          </DataTableBody>
        </DataTable>
      </div>
    </Panel>
  );
}

function CoachTableRow({
  row,
  callbacksOn,
  selectionsOn,
  canEdit,
  full,
  max,
  onToggle,
}: {
  row: CoachRow;
  callbacksOn: boolean;
  selectionsOn: boolean;
  canEdit: boolean;
  full: boolean;
  max: number;
  onToggle: () => void;
}) {
  const chosen = row.rank !== null;
  const pending = !!row.selection && isPendingSelection(row.selection);
  const disabled = !canEdit || pending || (!chosen && full);
  const hint = choiceHint({ canEdit, full: !chosen && full, max });
  const showcases = row.callback
    ? showcaseText(row.callback.showcaseNumbers)
    : null;

  return (
    <DataTableRow className="min-h-12">
      <DataTableCell kind="strong">
        {row.school.username ? (
          <Link
            to="/explore/$username"
            params={{ username: row.school.username }}
            className="text-fg s2s-focus rounded-(--radius-4) no-underline hover:underline"
          >
            {row.name}
          </Link>
        ) : (
          row.name
        )}
      </DataTableCell>
      <DataTableCell
        kind="dim"
        className="bp-phone:hidden flex min-w-0 items-center gap-(--space-8)"
      >
        {row.coach && (
          <PersonAvatar
            firstName={row.school.firstName}
            lastName={row.school.lastName}
            src={row.school.avatarUrl}
            className="size-6"
          />
        )}
        <span className="min-w-0 truncate">{row.coach || "–"}</span>
      </DataTableCell>
      {callbacksOn && (
        <DataTableCell className="flex min-w-0 items-center gap-(--space-8)">
          {row.callback ? (
            <>
              <Tag>
                <Icon icon={MegaphoneIcon} />
                Called
              </Tag>
              {showcases && (
                <span className="type-data-sm text-fg-3 bp-phone:hidden truncate">
                  {showcases}
                </span>
              )}
            </>
          ) : (
            <span className="text-fg-disabled">–</span>
          )}
        </DataTableCell>
      )}
      {selectionsOn && (
        <DataTableCell>
          <PillToggle
            variant="outline"
            pressed={chosen}
            onChange={onToggle}
            disabled={disabled}
            title={disabled ? hint : undefined}
            aria-label={
              chosen
                ? `Remove ${row.name} from top choices (currently #${row.rank})`
                : `Add ${row.name} to top choices`
            }
            icon={chosen ? undefined : PlusIcon}
            className={cn(chosen && "tabular-nums")}
          >
            {chosen ? `#${row.rank}` : "Add"}
          </PillToggle>
        </DataTableCell>
      )}
    </DataTableRow>
  );
}

function emptyText(
  filter: CoachFilter,
  query: string,
  callbacksReleased: boolean,
): string {
  const q = query.trim();
  if (q) return `No schools match “${q}”`;
  if (filter === "top") return "You haven’t picked any top choices yet";
  if (filter === "called")
    return callbacksReleased
      ? "No schools have called you back yet"
      : "Callbacks haven’t been released yet";
  return "No schools to show";
}
