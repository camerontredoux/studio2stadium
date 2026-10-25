import type * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/utils/cn";

type ChipProps = Omit<
  React.ComponentProps<typeof Badge>,
  "variant" | "size" | "render"
> & {
  /** Mono prefix in `fg-3` before the label ("122" in "122 Jane Doe"). */
  sub?: React.ReactNode;
  /** Mono label, for bibs and times. */
  mono?: boolean;
};

// Matches a small secondary Button (`<Button size="sm">`), so a static chip
// sits beside clickable ones without a visible difference. Overrides every
// components/ui/badge class the S2S look changes, so tailwind-merge drops the
// originals.
const chip =
  "h-(--control-sm) min-w-0 gap-(--space-6) rounded-(--radius-5) border-line-control bg-surface-raised dark:bg-surface-raised px-(--space-8) text-fg text-[12px] font-normal no-underline " +
  "[&_svg:not([class*='size-'])]:size-3.5 sm:[&_svg:not([class*='size-'])]:size-3.5 [&_svg:not([class*='opacity-'])]:opacity-100";

/**
 * A static 24px token for one small fact: a bib, a coach, a time. It isn't
 * clickable; use it where its parent already is (a collapsed widget, a row).
 * For a clickable chip use `<Button size="sm">`, with `ChipSub` for the prefix.
 */
function Chip({ sub, mono = false, className, children, ...props }: ChipProps) {
  return (
    <Badge
      variant="outline"
      className={cn(chip, mono && "font-mono tabular-nums", className)}
      {...props}
    >
      {sub !== undefined ? <ChipSub>{sub}</ChipSub> : null}
      {children}
    </Badge>
  );
}

/** The mono `fg-3` prefix of a chip or chip-style Button ("122" in "122 Jane Doe"). */
function ChipSub({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("text-fg-3 font-mono tabular-nums", className)}
      {...props}
    />
  );
}

type ChipRowProps = React.ComponentProps<"div">;

/** Lays chips out with `space-6` gaps; wraps on desktop and scrolls sideways on phones. */
function ChipRow({ className, ...props }: ChipRowProps) {
  return (
    <div
      className={cn(
        "bp-phone:flex-nowrap bp-phone:overflow-x-auto flex flex-wrap items-center gap-(--space-6)",
        className,
      )}
      {...props}
    />
  );
}

export { Chip, ChipRow, ChipSub };
