import {
  ArrowRightIcon,
  CaretDownIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import type * as React from "react";

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/components/utils/cn";

import { Icon } from "./icon";

type AuditLogRowProps = Omit<
  React.ComponentProps<typeof Collapsible>,
  "children"
> & {
  /** The row's cells, after the chevron. They sit in the parent grid's columns (rows are subgrids). */
  summary: React.ReactNode;
  /** The expanded detail, usually an `AuditDiff`. */
  children: React.ReactNode;
  /** Classes for the clickable summary row. */
  rowClassName?: string;
};

/**
 * An expandable audit log row for a grid table whose first column is 16px (the chevron).
 * Open state is Base UI's: pass `open`/`onOpenChange` to control it.
 */
function AuditLogRow({
  summary,
  children,
  rowClassName,
  className,
  ...props
}: AuditLogRowProps) {
  return (
    <Collapsible
      className={cn("col-span-full grid grid-cols-subgrid", className)}
      {...props}
    >
      <CollapsibleTrigger
        className={cn(
          "group type-body text-fg border-line-soft hover:bg-surface-hover data-panel-open:bg-surface-hover s2s-focus col-span-full m-0 grid min-h-(--row) w-full grid-cols-subgrid items-center border-0 border-b bg-transparent px-(--space-14) text-left focus-visible:-outline-offset-2 data-panel-open:border-b-transparent",
          rowClassName,
        )}
      >
        <Icon
          icon={CaretRightIcon}
          className="text-fg-3 group-data-panel-open:text-fg transition-transform duration-150 group-data-panel-open:rotate-90"
        />
        {summary}
      </CollapsibleTrigger>
      <CollapsiblePanel className="col-span-full">
        <div className="bg-surface-hover border-line-soft bp-phone:px-(--space-12) border-b pt-(--space-2) pr-(--space-14) pb-(--space-14) pl-[42px]">
          {children}
        </div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

type AuditDiffRow = {
  field: React.ReactNode;
  /** Value before the change; `null`/`undefined` shows a dash. */
  before?: React.ReactNode;
  /** Value after the change; `null`/`undefined` shows a dash. */
  after?: React.ReactNode;
};

type AuditDiffUnchanged = {
  field: React.ReactNode;
  value: React.ReactNode;
};

type AuditDiffProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Changed fields. */
  rows: readonly AuditDiffRow[];
  /** Mono fg-3 line above the table: exact time and record id. */
  meta?: React.ReactNode;
  /** `diff` (default) shows before → after; `values` shows one value column (creates, deletes). */
  variant?: "diff" | "values";
  /** Heading of the value column in the `values` variant. Default "Value". */
  valuesLabel?: React.ReactNode;
  /** Fields that didn't change, behind a "Show N unchanged" toggle. */
  unchanged?: readonly AuditDiffUnchanged[];
};

// Under 480px of its own width (phones), the table stacks: the field name on
// its own line, then the old value, then an arrow and the new value, so long
// emails and ids get the full width instead of two narrow columns.
const rowGrid =
  "grid grid-cols-[minmax(110px,160px)_minmax(0,1fr)_16px_minmax(0,1fr)] items-center gap-x-(--space-12) border-b border-surface-chip px-(--space-12) py-[7px] " +
  "@max-[480px]:grid-cols-[16px_minmax(0,1fr)] @max-[480px]:items-start @max-[480px]:gap-x-(--space-8) @max-[480px]:gap-y-(--space-2)";
const headRow = "bg-surface min-h-7 py-0 @max-[480px]:hidden";
const fieldCls = "type-data-sm text-fg-2 @max-[480px]:col-span-full";
const valueCls =
  "font-mono text-[12.5px] leading-[1.4] [overflow-wrap:anywhere]";
// Stacked: values sit in the second track; the arrow marks the new value.
const stackedValue = "@max-[480px]:col-start-2";
const stackedFull = "@max-[480px]:col-span-full";
const oldCls = "text-fg-3 line-through decoration-line-focus";
const nilCls = "text-fg-disabled";

function isEmpty(value: React.ReactNode) {
  return value === null || value === undefined;
}

/** The before-and-after table shown when an audit log row is expanded. */
function AuditDiff({
  rows,
  meta,
  variant = "diff",
  valuesLabel = "Value",
  unchanged = [],
  className,
  ...props
}: AuditDiffProps) {
  return (
    <div
      className={cn("@container flex flex-col gap-(--space-10)", className)}
      {...props}
    >
      {meta !== undefined && (
        <span className="type-meta text-fg-3">{meta}</span>
      )}
      <div className="border-line bg-bg-300 max-w-[880px] overflow-hidden rounded-(--radius-8) border">
        {variant === "diff" ? (
          <>
            <div className={cn(rowGrid, headRow)}>
              <span className="type-label text-fg-3">Field</span>
              <span className="type-label text-fg-3">Before</span>
              <span />
              <span className="type-label text-fg-3">After</span>
            </div>
            {rows.map((row, index) => (
              <div key={index} className={rowGrid}>
                <span className={fieldCls}>{row.field}</span>
                <span
                  className={cn(
                    valueCls,
                    stackedValue,
                    isEmpty(row.before) ? nilCls : oldCls,
                  )}
                >
                  {isEmpty(row.before) ? "—" : row.before}
                </span>
                <Icon
                  icon={ArrowRightIcon}
                  label="to"
                  className="text-fg-disabled @max-[480px]:mt-[2px]"
                />
                <span
                  className={cn(
                    valueCls,
                    isEmpty(row.after) ? nilCls : "text-fg",
                  )}
                >
                  {isEmpty(row.after) ? "—" : row.after}
                </span>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className={cn(rowGrid, headRow)}>
              <span className="type-label text-fg-3">Field</span>
              <span className="type-label text-fg-3 col-[2/-1]">
                {valuesLabel}
              </span>
            </div>
            {rows.map((row, index) => (
              <div key={index} className={rowGrid}>
                <span className={fieldCls}>{row.field}</span>
                <span
                  className={cn(
                    valueCls,
                    "col-[2/-1]",
                    stackedFull,
                    isEmpty(row.after) ? oldCls : "text-fg",
                  )}
                >
                  {isEmpty(row.after) ? row.before : row.after}
                </span>
              </div>
            ))}
          </>
        )}
        {unchanged.length > 0 && (
          <Collapsible>
            <CollapsiblePanel>
              {unchanged.map((row, index) => (
                <div key={index} className={rowGrid}>
                  <span className={fieldCls}>{row.field}</span>
                  <span
                    className={cn(
                      valueCls,
                      "text-fg-3 col-[2/-1]",
                      stackedFull,
                    )}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </CollapsiblePanel>
            <CollapsibleTrigger className="group text-fg-3 hover:bg-surface hover:text-fg s2s-focus type-caption flex h-[30px] w-full items-center gap-(--space-6) border-0 bg-transparent px-(--space-12) text-left focus-visible:-outline-offset-2">
              <Icon
                icon={CaretDownIcon}
                className="group-data-panel-open:rotate-180"
              />
              <span className="group-data-panel-open:hidden">Show</span>
              <span className="hidden group-data-panel-open:inline">Hide</span>
              {unchanged.length} unchanged
            </CollapsibleTrigger>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

export { AuditDiff, AuditLogRow };
export type {
  AuditDiffProps,
  AuditDiffRow,
  AuditDiffUnchanged,
  AuditLogRowProps,
};
