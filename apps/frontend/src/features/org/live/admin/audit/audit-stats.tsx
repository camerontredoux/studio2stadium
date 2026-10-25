import type { ReactNode } from "react";

import { Button } from "@/components/event/button";
import { Label } from "@/components/event/label";
import { Panel, PanelHead } from "@/components/event/panel";
import { ProgressBar } from "@/components/event/progress-bar";
import { RailSection, ShellRail } from "@/components/event/shell";
import { cn } from "@/components/utils/cn";
import type { AuditLogStats } from "@/features/org/api/audit-queries";
import { CollapsibleBar } from "@/features/org/live/shared/collapsible-bar";

import { ACTION_LABELS } from "./audit-format";

export type AuditStatsProps = {
  stats: AuditLogStats | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
};

type StatSection = {
  id: string;
  label: string;
  aside?: ReactNode;
  body: ReactNode;
};

const sectionBody = "px-(--space-14) pt-(--space-12) pb-(--space-14)";

function count(value: number | undefined, pending: boolean) {
  return pending || value === undefined ? "—" : value.toLocaleString();
}

function ActivityCounts({
  stats,
  isPending,
}: Pick<AuditStatsProps, "stats" | "isPending">) {
  const cells = [
    { label: "Today", value: stats?.activity.today },
    { label: "This week", value: stats?.activity.thisWeek },
    { label: "This month", value: stats?.activity.thisMonth },
  ];
  return (
    <dl className={cn("m-0 grid grid-cols-3 gap-(--space-10)", sectionBody)}>
      {cells.map((cell) => (
        <div key={cell.label} className="flex min-w-0 flex-col gap-(--space-4)">
          <dd className="type-display-stat text-fg m-0 truncate">
            {count(cell.value, isPending)}
          </dd>
          <dt className="type-caption-sm text-fg-3 order-first">
            {cell.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

/** The sections the old audit sidebar showed, from `auditQueries.stats`. */
function statSections({ stats, isPending }: AuditStatsProps): StatSection[] {
  const errors = stats?.recentErrors ?? 0;
  const uploads = stats?.uploadHealth;
  const actors = stats?.topActors ?? [];
  const breakdown = stats?.actionBreakdown ?? [];
  const maxBreakdown = Math.max(1, ...breakdown.map((row) => row.count));

  const sections: StatSection[] = [
    {
      id: "activity",
      label: "Activity",
      body: <ActivityCounts stats={stats} isPending={isPending} />,
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
        <ul
          className={cn(
            "m-0 flex list-none flex-col gap-(--space-10)",
            sectionBody,
          )}
        >
          {breakdown.map(({ action, count: n }) => (
            <li key={action} className="flex flex-col gap-(--space-4)">
              <div className="flex items-center justify-between gap-(--space-8)">
                <Label
                  className={cn(
                    action === "delete" ? "text-danger" : "text-fg",
                  )}
                >
                  {ACTION_LABELS[action]}
                </Label>
                <span className="type-data-sm text-fg-2">
                  {n.toLocaleString()}
                </span>
              </div>
              <ProgressBar
                value={Math.round((n / maxBreakdown) * 100)}
                label={`${ACTION_LABELS[action]} entries`}
                showValue={false}
              />
            </li>
          ))}
        </ul>
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

function ErrorNote({ onRetry }: Pick<AuditStatsProps, "onRetry">) {
  return (
    <div className="text-fg-3 type-caption flex items-center gap-(--space-10) px-(--space-14) py-(--space-12)">
      <span>Couldn’t load activity</span>
      <Button size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

/** Activity stats in the right rail, beside the log (above 1000px). */
export function AuditStatsRail(props: AuditStatsProps) {
  return (
    <ShellRail aria-label="Activity" className="bp-rail:hidden">
      {props.isError ? (
        <RailSection>
          <ErrorNote onRetry={props.onRetry} />
        </RailSection>
      ) : (
        <>
          {statSections(props).map((section) => (
            <RailSection key={section.id}>
              <PanelHead label={section.label} actions={section.aside} />
              {section.body}
            </RailSection>
          ))}
          {isEmpty(props) && (
            <RailSection>
              <p className="type-caption text-fg-3 m-0 px-(--space-14) py-(--space-12)">
                No activity recorded yet.
              </p>
            </RailSection>
          )}
        </>
      )}
    </ShellRail>
  );
}

/**
 * The same stats at 1000px and under, where the rail is hidden: a panel above
 * the log whose head sums up the counts and opens to every section.
 */
export function AuditStatsPanel(props: AuditStatsProps) {
  const { stats, isPending } = props;
  const errors = stats?.recentErrors ?? 0;
  const summary = [
    `Today ${count(stats?.activity.today, isPending)}`,
    `Week ${count(stats?.activity.thisWeek, isPending)}`,
    `Month ${count(stats?.activity.thisMonth, isPending)}`,
  ].join(" · ");
  const sections = statSections(props).filter(
    (section) => section.id !== "activity",
  );

  return (
    <Panel aria-label="Activity" className="bp-rail:flex hidden">
      {props.isError ? (
        <ErrorNote onRetry={props.onRetry} />
      ) : (
        <CollapsibleBar
          label="Activity"
          summary={summary}
          aside={
            !isPending &&
            errors > 0 && (
              <span className="type-data-sm text-danger shrink-0">
                {errors} {errors === 1 ? "error" : "errors"}
              </span>
            )
          }
        >
          <div className="border-line-soft bp-phone:grid-cols-1 grid grid-cols-2 border-t">
            {sections.map((section) => (
              <section
                key={section.id}
                aria-label={section.label}
                className="border-line-soft bp-phone:border-r-0 min-w-0 border-b last:border-b-0 odd:border-r"
              >
                <PanelHead
                  label={section.label}
                  actions={section.aside}
                  className="min-h-9 border-b-0"
                />
                {section.body}
              </section>
            ))}
            {isEmpty(props) && (
              <p className="type-caption text-fg-3 m-0 px-(--space-14) py-(--space-12)">
                No activity recorded yet.
              </p>
            )}
          </div>
        </CollapsibleBar>
      )}
    </Panel>
  );
}
