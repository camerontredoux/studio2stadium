import type * as React from "react";

import { cn } from "@/components/utils/cn";

type StatProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** The big number, 32px/600. */
  value: React.ReactNode;
  /** Optional total, shown as "/total" in 14px mono fg-3. */
  of?: React.ReactNode;
  /** Short caption after the number, 12.5px fg-3, e.g. "checked in". */
  caption?: React.ReactNode;
};

/** The one big number on a peek tile, with an optional "/total" and caption on its baseline. */
function Stat({ value, of, caption, className, ...props }: StatProps) {
  return (
    <span
      className={cn(
        "flex items-baseline",
        of !== undefined ? "gap-(--space-6)" : "gap-(--space-8)",
        className,
      )}
      {...props}
    >
      <span className="type-display-stat text-fg">{value}</span>
      {of !== undefined && (
        <span className="text-fg-3 font-mono text-[14px] leading-[1.4] tabular-nums">
          /{of}
        </span>
      )}
      {caption !== undefined && (
        <span className="text-fg-3 text-[12.5px] leading-[1.4]">{caption}</span>
      )}
    </span>
  );
}

export { Stat };
export type { StatProps };
