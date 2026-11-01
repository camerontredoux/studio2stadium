import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import type * as React from "react";

import { cn } from "@/components/utils/cn";

import { Checkbox } from "./checkbox";
import { Icon } from "./icon";

/** Splits a grid template into its top-level tracks; `null` when it uses `repeat()`. */
function splitTracks(template: string): string[] | null {
  if (template.includes("repeat(")) return null;
  const tracks: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of template.trim()) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (/\s/.test(char) && depth === 0) {
      if (current) tracks.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current) tracks.push(current);
  return tracks;
}

/** Phone default: the first column fits its content, the rest split the width evenly. */
function phoneTemplate(columns: string): string {
  const tracks = splitTracks(columns);
  if (!tracks || tracks.length < 2) return columns;
  return ["max-content", ...tracks.slice(1).map(() => "minmax(0,1fr)")].join(
    " ",
  );
}

type DataTableProps = React.ComponentProps<"div"> & {
  /** The grid template for every row, e.g. `"64px minmax(120px,1fr) 96px"`. Leave out the checkbox column; `selectable` adds it. */
  columns: string;
  /** The template used on phones (≤800px). Default: first column `max-content`, the rest `minmax(0,1fr)` each. Hide dropped cells with `bp-phone:hidden`. */
  phoneColumns?: string;
  /** Adds the 16px checkbox column in front of both templates. Default false. */
  selectable?: boolean;
};

/**
 * A CSS-grid table: rows are subgrids of one grid, so every column lines up even when
 * sized by content. Put it in a scroll container (with a `min-w-*` here) for the sticky head.
 *
 * The rows' side padding (`--dt-pad`: 14px, 12px on phones) sits on the table, and each
 * row pulls itself out over it with a matching negative margin. A subgrid hands its
 * margin + padding on to the items in its edge tracks, so the two cancel and every track
 * keeps the width the template gives it. A custom full-width subgrid row inside the table
 * (e.g. a collapsible) uses `-mx-(--dt-pad) px-(--dt-pad)` the same way.
 */
function DataTable({
  columns,
  phoneColumns,
  selectable = false,
  className,
  style,
  ...props
}: DataTableProps) {
  const phone = phoneColumns ?? phoneTemplate(columns);
  const prefix = selectable ? "16px " : "";
  return (
    <div
      role="table"
      className={cn(
        "text-fg type-body grid grid-cols-(--dt-cols) gap-x-(--space-12) px-(--dt-pad) [--dt-pad:var(--space-14)]",
        "bp-phone:grid-cols-(--dt-cols-phone) bp-phone:gap-x-(--space-10) bp-phone:[--dt-pad:var(--space-12)]",
        className,
      )}
      style={
        {
          "--dt-cols": prefix + columns,
          "--dt-cols-phone": prefix + phone,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

const rowBase =
  "col-span-full grid grid-cols-subgrid items-center min-h-(--row) -mx-(--dt-pad) px-(--dt-pad) border-b border-line-soft";

type DataTableHeadProps = React.ComponentProps<"div">;

/** The sticky 32px header row on surface-head. Children are `DataTableHeaderCell`s. */
function DataTableHead({ className, children, ...props }: DataTableHeadProps) {
  return (
    <div role="rowgroup" className="contents">
      <div
        role="row"
        className={cn(
          rowBase,
          "bg-surface-head sticky top-0 z-2 min-h-(--row-head)",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

type SortDirection = "asc" | "desc" | null;

type DataTableHeaderCellProps = Omit<React.ComponentProps<"div">, "onClick"> & {
  /** Current sort of this column. Set it (`null` when unsorted) to mark the column sortable. */
  sortDirection?: SortDirection;
  /** Called when the column label is clicked. Renders the label as a button. */
  onSort?: () => void;
  /** `end` right-aligns the label, for numeric columns. Default `start`. */
  align?: "start" | "end";
};

const ariaSort = {
  asc: "ascending",
  desc: "descending",
} as const;

/** A column label (11px mono, sentence case). With `onSort` it is a button with a caret when sorted. */
function DataTableHeaderCell({
  sortDirection,
  onSort,
  align = "start",
  className,
  children,
  ...props
}: DataTableHeaderCellProps) {
  const sortable = sortDirection !== undefined || onSort !== undefined;
  return (
    <div
      role="columnheader"
      aria-sort={
        sortable
          ? sortDirection
            ? ariaSort[sortDirection]
            : "none"
          : undefined
      }
      className={cn(
        "type-label text-fg-3 bp-phone:overflow-hidden flex min-w-0 items-center",
        align === "end" && "justify-end text-right",
        className,
      )}
      {...props}
    >
      {onSort ? (
        <button
          type="button"
          onClick={onSort}
          data-on={sortDirection ? "" : undefined}
          className="hover:text-fg data-on:text-fg s2s-focus inline-flex h-(--control-sm) cursor-pointer items-center gap-(--space-4) rounded-(--radius-4) border-0 bg-transparent p-0 whitespace-nowrap"
        >
          {children}
          {sortDirection === "asc" && <Icon icon={CaretUpIcon} size={12} />}
          {sortDirection === "desc" && <Icon icon={CaretDownIcon} size={12} />}
        </button>
      ) : (
        children
      )}
    </div>
  );
}

type DataTableBodyProps = React.ComponentProps<"div">;

/** Groups the body rows; the last row drops its divider. */
function DataTableBody({ className, ...props }: DataTableBodyProps) {
  return (
    <div
      role="rowgroup"
      className={cn("contents [&>[role=row]:last-child]:border-b-0", className)}
      {...props}
    />
  );
}

type DataTableRowProps = useRender.ComponentProps<"div"> & {
  /** Selected rows sit on surface-chip. */
  selected?: boolean;
  /** A totals row on surface-head, without the hover state. */
  total?: boolean;
};

/** A 44px body row. Use `render` to make the whole row a link. */
function DataTableRow({
  selected = false,
  total = false,
  className,
  render,
  ...props
}: DataTableRowProps) {
  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        role: "row",
        "data-selected": selected ? "" : undefined,
        className: cn(
          rowBase,
          "text-fg no-underline",
          total ? "bg-surface-head" : "hover:bg-surface-hover",
          selected && "bg-surface-chip hover:bg-surface-chip",
          className,
        ),
      } as React.ComponentProps<"div">,
      props,
    ),
  });
}

type DataTableCellKind = "text" | "strong" | "dim" | "mono" | "num" | "status";

type DataTableCellProps = React.ComponentProps<"div"> & {
  /**
   * `text` (default) 13px fg; `strong` names, 500 and truncated; `dim` emails and
   * schools in fg-2, truncated; `mono` bibs; `num` counts, right-aligned tabular;
   * `status` 11px mono (set the colour per row, e.g. `text-fg-3`).
   */
  kind?: DataTableCellKind;
};

const cellKinds: Record<DataTableCellKind, string> = {
  text: "min-w-0",
  strong: "min-w-0 truncate font-medium",
  dim: "min-w-0 truncate text-fg-2",
  mono: "type-data text-fg",
  num: "type-data text-right",
  status: "type-label",
};

/** One cell in a `DataTableRow`. */
function DataTableCell({
  kind = "text",
  className,
  ...props
}: DataTableCellProps) {
  return (
    <div role="cell" className={cn(cellKinds[kind], className)} {...props} />
  );
}

type DataTableSelectCellProps = Omit<
  React.ComponentProps<"div">,
  "onChange" | "children"
> & {
  /** Accessible name, e.g. "Select all" or "Select Jordan Lee". */
  label: string;
  checked: boolean;
  /** Some but not all rows are selected (header cell). */
  indeterminate?: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Render as the header's columnheader instead of a cell. Default false. */
  header?: boolean;
};

/** The checkbox column cell, for a row or (with `header`) for "select all". */
function DataTableSelectCell({
  label,
  checked,
  indeterminate = false,
  disabled,
  onCheckedChange,
  header = false,
  className,
  ...props
}: DataTableSelectCellProps) {
  return (
    <div
      role={header ? "columnheader" : "cell"}
      className={cn("flex items-center", className)}
      {...props}
    >
      <Checkbox
        label={label}
        hideLabel
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        onChange={onCheckedChange}
      />
    </div>
  );
}

type DataTableEmptyProps = React.ComponentProps<"div"> & {
  /** An action after the text, usually a "Clear filters" `Button`. */
  action?: React.ReactNode;
};

/** The empty-results row: centred fg-3 text and an optional action. */
function DataTableEmpty({
  action,
  className,
  children,
  ...props
}: DataTableEmptyProps) {
  return (
    <div role="row" className="col-span-full -mx-(--dt-pad)">
      <div
        role="cell"
        className={cn(
          "text-fg-3 flex items-center justify-center gap-(--space-10) px-(--space-14) py-[28px]",
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        {action}
      </div>
    </div>
  );
}

export {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DataTableSelectCell,
};
export type {
  DataTableBodyProps,
  DataTableCellKind,
  DataTableCellProps,
  DataTableEmptyProps,
  DataTableHeadProps,
  DataTableHeaderCellProps,
  DataTableProps,
  DataTableRowProps,
  DataTableSelectCellProps,
  SortDirection,
};
