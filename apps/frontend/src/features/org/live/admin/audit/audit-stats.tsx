import { ProgressBar } from "@/components/event/progress-bar";
import { cn } from "@/components/utils/cn";
import type { AuditLogStats } from "@/features/org/api/audit-queries";
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

import { ACTION_LABELS } from "./audit-format";

export type AuditStatsProps = {
  stats: AuditLogStats | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
};

/** The sections the old audit sidebar showed, from `auditQueries.stats`. */
function statSections({ stats, isPending }: AuditStatsProps): StatSection[] {
  const errors = stats?.recentErrors ?? 0;
  const uploads = stats?.uploadHealth;
  const actors = stats?.topActors ?? [];
  const breakdown = stats?.actionBreakdown ?? [];

  const sections: StatSection[] = [
    {
      id: "activity",
      label: "Activity",
      railOnly: true,
      body: (
        <StatCells
          isPending={isPending}
          cells={[
            { label: "Today", value: stats?.activity.today },
            { label: "This week", value: stats?.activity.thisWeek },
            { label: "This month", value: stats?.activity.thisMonth },
          ]}
        />
      ),
    },
    {
      id: "errors",
      label: "Recent errors",
      aside: <span className="type-meta text-fg-3">Last 7 days</span>,
      body: (
        <div className={cn("flex items-baseline gap-(--space-8)", sectionBody)}>
          <span
            className={cn(
              "type-display-stat",
              !isPending && errors > 0 ? "text-danger" : "text-fg",
            )}
          >
            {count(stats?.recentErrors, isPending)}
          </span>
          <span className="type-caption text-fg-3">
            {errors === 1 ? "entry with an error" : "entries with an error"}
          </span>
        </div>
      ),
    },
    {
      id: "uploads",
      label: "Upload health",
      body: (
        <div className={cn("flex flex-col gap-(--space-8)", sectionBody)}>
          {isPending || !uploads ? (
            <span className="type-caption text-fg-3">—</span>
          ) : uploads.total === 0 ? (
            <span className="type-caption text-fg-3">No uploads yet</span>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-(--space-8)">
                <span className="type-caption text-fg-3">Without errors</span>
                <span className="type-data-sm text-fg-2">
                  {uploads.total.toLocaleString()}{" "}
                  {uploads.total === 1 ? "upload" : "uploads"}
                </span>
              </div>
              <ProgressBar
                value={uploads.successRate}
                label="Uploads without errors"
                strong
              />
              <span className="type-meta text-fg-3">
                {uploads.totalRows.toLocaleString()} rows ·{" "}
                <span className={cn(uploads.erroredRows > 0 && "text-danger")}>
                  {uploads.erroredRows.toLocaleString()} with errors
                </span>
              </span>
            </>
          )}
        </div>
      ),
    },
  ];

  if (actors.length > 0) {
    sections.push({
      id: "actors",
      label: "Top actors",
      body: (
        <ol
          className={cn(
            "m-0 flex list-none flex-col gap-(--space-8)",
            sectionBody,
          )}
        >
          {actors.map((actor, index) => (
            <li
              key={actor.id}
              className="flex min-w-0 items-center gap-(--space-10)"
            >
              <span className="type-data-sm text-fg-3 w-4 shrink-0 text-right">
                {index + 1}
              </span>
              <span className="type-body text-fg min-w-0 flex-1 truncate font-medium">
                {actor.name}
              </span>
              <span className="type-data-sm text-fg-2 shrink-0">
                {actor.count.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      ),
    });
  }

  if (breakdown.length > 0) {
    sections.push({
      id: "actions",
      label: "Action breakdown",
      body: (
        <BarList
          items={breakdown.map(({ action, count: n }) => ({
            key: action,
            label: ACTION_LABELS[action],
            count: n,
            tone: action === "delete" ? "text-danger" : undefined,
            barLabel: `${ACTION_LABELS[action]} entries`,
          }))}
        />
      ),
    });
  }

  return sections;
}

function isEmpty({ stats, isPending }: AuditStatsProps) {
  return (
    !isPending &&
    !!stats &&
    stats.activity.thisMonth === 0 &&
    stats.actionBreakdown.length === 0
  );
}

function sidebarProps(props: AuditStatsProps): StatsSidebarProps {
  const { stats, isPending } = props;
  const errors = stats?.recentErrors ?? 0;
  return {
    label: "Activity",
    sections: statSections(props),
    summary: [
      `Today ${count(stats?.activity.today, isPending)}`,
      `Week ${count(stats?.activity.thisWeek, isPending)}`,
      `Month ${count(stats?.activity.thisMonth, isPending)}`,
    ].join(" · "),
    aside: !isPending && errors > 0 && (
      <span className="type-data-sm text-danger shrink-0">
        {errors} {errors === 1 ? "error" : "errors"}
      </span>
    ),
    empty: isEmpty(props) && (
      <p className="type-caption text-fg-3 m-0 px-(--space-14) py-(--space-12)">
        No activity recorded yet.
      </p>
    ),
    isError: props.isError,
    errorText: "Couldn’t load activity",
    onRetry: props.onRetry,
  };
}

/** Activity stats in the right rail, beside the log (above 1000px). */
export function AuditStatsRail(props: AuditStatsProps) {
  return <StatsRail {...sidebarProps(props)} />;
}

/**
 * The same stats at 1000px and under, where the rail is hidden: a panel above
 * the log whose head sums up the counts and opens to every section.
 */
export function AuditStatsPanel(props: AuditStatsProps) {
  return <StatsPanel {...sidebarProps(props)} />;
}
