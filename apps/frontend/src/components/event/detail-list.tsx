import type * as React from "react";

import { cn } from "@/components/utils/cn";

type DetailListProps = React.ComponentProps<"dl">;

/** Stacked term and value pairs, as in the rail's event details. Children are `DetailListItem`s. */
function DetailList({ className, ...props }: DetailListProps) {
  return (
    <dl
      className={cn(
        "m-0 flex flex-col gap-(--space-12) px-(--space-14) pt-(--space-12) pb-(--space-14)",
        className,
      )}
      {...props}
    />
  );
}

type DetailListItemProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The term, 11.5px fg-3, e.g. "Dates · 2026". */
  label: React.ReactNode;
  /** The value, 13px fg. Ignored when `children` is given. */
  value?: React.ReactNode;
  /** A second line under the value, 12px fg-2. */
  sub?: React.ReactNode;
  /** Set the value in mono. Default false. */
  mono?: boolean;
  /** Custom value content laid out in a row with a 6px gap, e.g. a start and end chip that each open a picker. */
  children?: React.ReactNode;
};

/** One term and value. Pass `children` instead of `value` for chips or links. */
function DetailListItem({
  label,
  value,
  sub,
  mono = false,
  className,
  children,
  ...props
}: DetailListItemProps) {
  return (
    <div
      className={cn("flex min-w-0 flex-col gap-(--space-4)", className)}
      {...props}
    >
      <dt className="type-caption-sm text-fg-3">{label}</dt>
      {children !== undefined ? (
        <dd className="m-0 flex min-w-0 items-center gap-(--space-6)">
          {children}
        </dd>
      ) : (
        <dd className="m-0 flex min-w-0 flex-col gap-(--space-2)">
          <span className={cn("text-fg", mono ? "type-data" : "type-body")}>
            {value}
          </span>
          {sub !== undefined && (
            <span className="type-caption text-fg-2">{sub}</span>
          )}
        </dd>
      )}
    </div>
  );
}

export { DetailList, DetailListItem };
export type { DetailListItemProps, DetailListProps };
