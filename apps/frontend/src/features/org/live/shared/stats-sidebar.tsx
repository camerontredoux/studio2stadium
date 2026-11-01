import type { ReactNode } from "react";

import { Button } from "@/components/event/button";
import { Label } from "@/components/event/label";
import { Panel, PanelHead } from "@/components/event/panel";
import { ProgressBar } from "@/components/event/progress-bar";
import { RailSection, ShellRail } from "@/components/event/shell";
import { cn } from "@/components/utils/cn";
import { CollapsibleBar } from "@/features/org/live/shared/collapsible-bar";
import { sectionBody, statCount } from "@/features/org/live/shared/stat-format";

export type StatSection = {
  id: string;
  label: string;
  aside?: ReactNode;
  body: ReactNode;
  /** Left out of the folded panel, whose bar already sums it up. */
  railOnly?: boolean;
};

export type StatsSidebarProps = {
  /** Names the rail and the panel, and labels the panel's bar. */
  label: string;
  sections: StatSection[];
  /** The panel bar's one-line summary. */
  summary: ReactNode;
  /** Shown at the right end of the panel bar, e.g. an error count. */
  aside?: ReactNode;
  /** Shown after the sections, e.g. when there is nothing to count yet. */
  empty?: ReactNode;
  isError: boolean;
  errorText: string;
  onRetry: () => void;
};

/** A row of big numbers with small labels above them. */
export function StatCells({
  cells,
  isPending,
}: {
  cells: { label: string; value: number | undefined; tone?: string }[];
  isPending: boolean;
}) {
  return (
    <dl
      className={cn(
        "m-0 grid gap-(--space-10)",
        cells.length === 2 ? "grid-cols-2" : "grid-cols-3",
        sectionBody,
      )}
    >
      {cells.map((cell) => (
        <div key={cell.label} className="flex min-w-0 flex-col gap-(--space-4)">
          <dd
            className={cn(
              "type-display-stat m-0 truncate",
              cell.tone ?? "text-fg",
            )}
          >
            {statCount(cell.value, isPending)}
          </dd>
          <dt className="type-caption-sm text-fg-3 order-first">
            {cell.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

/** Labelled counts, each with a bar against the largest. */
export function BarList({
  items,
}: {
  items: {
    key: string;
    label: string;
    count: number;
    tone?: string;
    /** Names the bar for screen readers; defaults to the label. */
    barLabel?: string;
  }[];
}) {
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <ul
      className={cn(
        "m-0 flex list-none flex-col gap-(--space-10)",
        sectionBody,
      )}
    >
      {items.map((item) => (
        <li key={item.key} className="flex flex-col gap-(--space-4)">
          <div className="flex items-center justify-between gap-(--space-8)">
            <Label className={item.tone ?? "text-fg"}>{item.label}</Label>
            <span className="type-data-sm text-fg-2">
              {item.count.toLocaleString()}
            </span>
          </div>
          <ProgressBar
            value={Math.round((item.count / max) * 100)}
            label={item.barLabel ?? item.label}
            showValue={false}
          />
        </li>
      ))}
    </ul>
  );
}

function ErrorNote({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="text-fg-3 type-caption flex items-center gap-(--space-10) px-(--space-14) py-(--space-12)">
      <span>{text}</span>
      <Button size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

/** The sections in the right rail, beside the page (above 1000px). */
export function StatsRail(props: StatsSidebarProps) {
  return (
    <ShellRail aria-label={props.label} className="bp-rail:hidden">
      {props.isError ? (
        <RailSection>
          <ErrorNote text={props.errorText} onRetry={props.onRetry} />
        </RailSection>
      ) : (
        <>
          {props.sections.map((section) => (
            <RailSection key={section.id}>
              <PanelHead label={section.label} actions={section.aside} />
              {section.body}
            </RailSection>
          ))}
          {props.empty && <RailSection>{props.empty}</RailSection>}
        </>
      )}
    </ShellRail>
  );
}

/**
 * The same sections at 1000px and under, where the rail is hidden: a panel
 * above the page whose bar sums them up and opens to every section.
 */
export function StatsPanel(props: StatsSidebarProps) {
  const sections = props.sections.filter((section) => !section.railOnly);
  return (
    <Panel aria-label={props.label} className="bp-rail:flex hidden">
      {props.isError ? (
        <ErrorNote text={props.errorText} onRetry={props.onRetry} />
      ) : (
        <CollapsibleBar
          label={props.label}
          summary={props.summary}
          aside={props.aside}
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
            {props.empty}
          </div>
        </CollapsibleBar>
      )}
    </Panel>
  );
}
