import {
  HeartIcon,
  PencilSimpleIcon,
  StarIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

import { Icon } from "@/components/event/icon";
import { ProgressBar } from "@/components/event/progress-bar";
import { cn } from "@/components/utils/cn";
import type { paths } from "@/lib/api/types";
import { relativeTime } from "@/features/org/live/admin/audit/audit-format";
import {
  sectionBody,
  statCount as count,
} from "@/features/org/live/shared/stat-format";
import {
  BarList,
  StatCells,
  StatsPanel,
  StatsRail,
  type StatSection,
  type StatsSidebarProps,
} from "@/features/org/live/shared/stats-sidebar";

import { GPA_RANGES } from "./roster-filters";

export type DancerSummary =
  paths["/orgs/{slug}/dancer-summary"]["get"]["responses"]["200"]["content"]["application/json"];

type ActivityItem = DancerSummary["activity"][number];

export type CoachRosterSidebarInput = {
  summary: DancerSummary | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  callbacksEnabled: boolean;
  /** Whether a search or filter narrows the roster. */
  narrowed: boolean;
  onOpenDancer: (rosterId: string) => void;
};

const ACTIVITY: Record<
  ActivityItem["type"],
  { icon: PhosphorIcon; tone: string; verb: (item: ActivityItem) => string }
> = {
  favorite: { icon: HeartIcon, tone: "text-danger", verb: () => "Favorited" },
  rate: {
    icon: StarIcon,
    tone: "text-star",
    verb: (item) => (item.rating ? `Rated ${item.rating}` : "Rated"),
  },
  note: { icon: PencilSimpleIcon, tone: "text-fg-2", verb: () => "Noted" },
};

const note = "type-caption text-fg-3 m-0";

function Progress({
  summary,
  isPending,
  narrowed,
}: Pick<CoachRosterSidebarInput, "summary" | "isPending" | "narrowed">) {
  const counts = summary?.counts;
  const total = counts?.all ?? 0;
  const pct =
    counts && total > 0 ? Math.round((counts.reviewed / total) * 100) : 0;
  return (
    <div className={cn("flex flex-col gap-(--space-8)", sectionBody)}>
      <div className="flex items-baseline justify-between gap-(--space-8)">
        <span className="type-caption text-fg-3">
          <span className="type-data-sm text-fg">
            {count(counts?.reviewed, isPending)}
          </span>{" "}
          of {count(counts?.all, isPending)} reviewed
        </span>
        <span className="type-data-sm text-fg-2">
          {isPending ? "—" : `${pct}%`}
        </span>
      </div>
      <ProgressBar value={pct} label="Dancers reviewed" showValue={false} />
      {narrowed && counts && (
        <span className="type-meta text-fg-3">
          {counts.matching.toLocaleString()} match your filters ·{" "}
          {counts.matchingToReview.toLocaleString()} to review
        </span>
      )}
    </div>
  );
}

function ActivityFeed({
  items,
  onOpenDancer,
}: {
  items: ActivityItem[];
  onOpenDancer: (rosterId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className={cn(note, sectionBody)}>
        Start scouting to see your activity here.
      </p>
    );
  }
  return (
    <ul
      className={cn("m-0 flex list-none flex-col gap-(--space-4)", sectionBody)}
    >
      {items.map((item) => {
        const kind = ACTIVITY[item.type];
        const name = `${item.firstName} ${item.lastName}`.trim();
        return (
          <li key={`${item.type}-${item.rosterId}`}>
            <button
              type="button"
              onClick={() => onOpenDancer(item.rosterId)}
              className="s2s-focus hover:bg-surface-hover -mx-(--space-6) flex w-[calc(100%+var(--space-12))] min-w-0 items-center gap-(--space-10) rounded-(--radius-6) border-0 bg-transparent px-(--space-6) py-(--space-4) text-left"
            >
              <Icon
                icon={kind.icon}
                weight="fill"
                className={cn("shrink-0", kind.tone)}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-body text-fg truncate font-medium">
                  {item.bibNumber !== null && (
                    <span className="type-data-sm text-fg-3 me-(--space-6)">
                      #{item.bibNumber}
                    </span>
                  )}
                  {name}
                </span>
                <span className="type-meta text-fg-3 truncate">
                  {kind.verb(item)} · {relativeTime(item.at)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function bars<T>(
  rows: T[] | undefined,
  item: (row: T) => { key: string; label: string; count: number },
  empty: string,
) {
  if (!rows) return <p className={cn(note, sectionBody)}>—</p>;
  if (rows.length === 0)
    return <p className={cn(note, sectionBody)}>{empty}</p>;
  return <BarList items={rows.map(item)} />;
}

/**
 * The coach's Dancers sidebar, in the audit log's rail and folded panel: their
 * review progress, recent marks and the talent pool. Everything counts the
 * whole roster from the dancer summary, not the page of rows loaded.
 */
function coachRosterSidebar({
  summary,
  isPending,
  isError,
  onRetry,
  callbacksEnabled,
  narrowed,
  onOpenDancer,
}: CoachRosterSidebarInput): StatsSidebarProps {
  const counts = summary?.counts;
  const pool = summary?.talentPool;
  const anyGpa = pool?.gpa.some((band) => band.count > 0);

  const sections: StatSection[] = [
    {
      id: "session",
      label: "Your session",
      railOnly: true,
      body: (
        <StatCells
          isPending={isPending}
          cells={[
            { label: "To review", value: counts?.toReview },
            { label: "Favorited", value: counts?.favorites },
            ...(callbacksEnabled
              ? [{ label: "Callbacks", value: counts?.calledBack }]
              : []),
          ]}
        />
      ),
    },
    {
      id: "progress",
      label: "Progress",
      body: (
        <Progress summary={summary} isPending={isPending} narrowed={narrowed} />
      ),
    },
    {
      id: "activity",
      label: "Recent activity",
      body: isPending ? (
        <p className={cn(note, sectionBody)}>—</p>
      ) : (
        <ActivityFeed
          items={summary?.activity ?? []}
          onOpenDancer={onOpenDancer}
        />
      ),
    },
    {
      id: "years",
      label: "Talent pool by year",
      body: bars(
        pool?.years,
        (row) => ({
          key: String(row.year),
          label: String(row.year),
          count: row.count,
        }),
        "No graduation years yet",
      ),
    },
    {
      id: "gpa",
      label: "Talent pool by GPA",
      body: bars(
        pool && (anyGpa ? pool.gpa : []),
        (band) => ({
          key: band.key,
          label: GPA_RANGES[band.key]?.label ?? band.key,
          count: band.count,
        }),
        "No GPAs yet",
      ),
    },
    {
      id: "states",
      label: "Top states",
      aside: pool && pool.otherStates > 0 && (
        <span className="type-meta text-fg-3">+{pool.otherStates} more</span>
      ),
      body: bars(
        pool?.states,
        (row) => ({ key: row.state, label: row.state, count: row.count }),
        "No states yet",
      ),
    },
  ];

  // The roster's Callbacks tab already shows its count, so a phone's bar skips it.
  const summaryLine = [
    `${count(counts?.toReview, isPending)} to review`,
    `${count(counts?.favorites, isPending)} favorited`,
  ].join(" · ");

  return {
    label: "Scouting",
    sections,
    summary: summaryLine,
    aside: counts && counts.all > 0 && (
      <span className="type-data-sm text-fg-2 bp-small:hidden shrink-0">
        {Math.round((counts.reviewed / counts.all) * 100)}% reviewed
      </span>
    ),
    isError,
    errorText: "Couldn’t load your scouting summary",
    onRetry,
  };
}

/** The coach's scouting stats in the right rail (above 1000px). */
export function CoachRosterRail(props: CoachRosterSidebarInput) {
  return <StatsRail {...coachRosterSidebar(props)} />;
}

/** The same stats folded into a panel above the roster (1000px and under). */
export function CoachRosterPanel(props: CoachRosterSidebarInput) {
  return <StatsPanel {...coachRosterSidebar(props)} />;
}
